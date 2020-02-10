app.filter('workInfoWordCount',function($filter){
    return function(item,type) {
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        let wc = 0;
        if(subType==0)
             wc = item.work.wordCount;
        else
             wc = item.chapter.wordCount;
        return $filter('wordCount')(wc);
    }
});

app.filter('workInfoTitle', function($filter) { //可以注入依赖
    return function(item,type) {
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        if(subType==0)
            return item.work.title;
        else
            return $filter('chapter')(item.index.order) +'     ' + item.chapter.title;
    }
});

app.filter('workInfoLink',function($filter){
    return function(item,type){
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        if(subType==0)
            return '/fanfic/work/'+item.work._id;
        else
            return '/fanfic/'+item.chapter._id;
    }
});

app.filter('workInfoVisited',function($filter){
    return function(item,type){
        let workVisited = item.work.visited || 0;
        let subType = item.infoType;
        if(subType == undefined)
            subType = type;
        if(subType==0)
            return workVisited;
        else
            return item.chapter.visited;
    }
});

app.filter('workInfoDate',function($filter){
    return function(item,type){
        let prefix = '发布于:';
        let chapterUpdate = item.updated;
        let subType = item.infoType;
        if(!chapterUpdate && subType == 0)
            chapterUpdate = item.work.updated;
        if(!chapterUpdate)
            chapterUpdate = item.chapter.date;
        if(item.infoType == 1)
            prefix = '增加于:';

        return prefix+ $filter('dateInfo')(chapterUpdate,0);
    }
});

app.filter('workInfoStatus',function(){
    return function(item){
        return item? '连载中':'已完结';
    }
});

app.directive('workInfoOuter',function($compile) {
    return {
        restrict: "C",
        link:function(scope,element,attr){
            if(scope.item.infoType == 0)
            {
                element.css('border-color','rgba(181,163,160,218)');
                element.css('box-Shadow','1px solid rgba(181,163,160,218)');
            }
        }
    }
});


app.directive('gradeShow',function(){
    return {
        restrict: "A",
        scope:{
            grade: '@'
        },
        link: function (scope, element, attr) {
            if(scope.grade  == 1)
                element.css('background','rgba(251,161,0,255)');
            else if(scope.grade == 2)
                element.css('background','rgba(139,100,127,255)');
        }
    }
});

app.directive('workInfo',function($compile,$rootScope,fanficManager,feedbackManager) {
    return {
        restrict: "E",
        templateUrl:'/view/modules/workInfo.html',
        link:function(scope,element,attr) {
            scope.status = 1;
            scope.showComment = false;
            scope.showFeedBack = false;
            scope.requestingFeed = false;
            scope.feedback = [];
            scope.type = Number(attr.type);
            scope.liked = false;
            scope.bookMarked = false;

            if (scope.item.work.feedback) {
                let feedback = scope.item.work.feedback;
                feedback.forEach(function (item) {
                    if (item.type === 1)
                        scope.liked = Boolean(item.status);
                    else if (item.type === 2)
                        scope.bookMarked = Boolean(item.status);
                })
            }

            scope.feedback = scope.item.work.feedbackAll || [];
            scope.workType = 1;
            if (scope.item.work.chapterCount <= 1 && scope.item.work.status == 0)
                scope.workType = 0;
            if (scope.item.infoType === 0)
                scope.item.user = scope.item.work.user;
            else
                scope.item.user = scope.item.chapter.user._id || scope.item.chapter.user;

            scope.type = Number(scope.type && scope.workType);

            scope.commentList = scope.item.commentList;

            scope.deleteItem = function () {
                let alertInfo = [];
                let primaryInfo = '您是否确定要删除本';
                primaryInfo += scope.item.infoType ? '章节' : '作品';
                primaryInfo += '?';
                alertInfo.push(primaryInfo);
                if (scope.item.infoType === 0)
                    alertInfo.push('删除本作品将同时删除该作品下的所有章节，是否确定删除？');
                else if (scope.item.infoType === 1 && scope.item.work.chapterCount <= 1) {
                    alertInfo.push('该章节为本作品仅有的章节，删除该章节将同时删除该作品，您是否了解这一点?');
                    alertInfo.push('如您仅需要修改本章节内容，建议选择编辑选项。');
                }
                let data = {alertInfo: alertInfo};
                data.signal = 'deleteChapter' + scope.item.chapter._id + scope.item.infoType;
                scope.$emit('showAlert', data);
                scope.status = 5;
            };

            scope.likeIt = function () {
                let data = {work: scope.item.work._id, user: scope.item.work.user};
                feedbackManager.likeIt(data);
            };

            scope.bookMarkIt = function () {
                let data = {work: scope.item.work._id, user: scope.item.work.user};
                feedbackManager.bookMarkIt(data);
            };

            scope.requestFeedback = function () {

            };

            scope.showCommentList = function () {
                scope.showFeedBack = false;
                scope.showComment = !scope.showComment;
            };

            scope.showFeedbackList = function () {
                scope.showComment = false;
                scope.showFeedBack = !scope.showFeedBack;
            };

            scope.initializeCommentData = function(){
               scope.workId = scope.item.work._id;
               scope.chapterId = scope.item.chapter._id;
               scope.infoType = scope.item.infoType;
               scope.targetUser = scope.item.chapter.user;
               scope.userId = scope.item.user;
            };

            scope.updateCommentCount = function(data){
                if (scope.item.infoType === 0)
                    scope.item.work.comments = data.commentCount;
                else if (scope.item.infoType === 1)
                    scope.item.chapter.comments = data.commentCount;
            };

            scope.updateFeedBackData = function (data) {
                if (!data.user)
                    return;
                let newData = {type: data.type, userName: data.userName, user: data.user, status: data.status};

                let step = data.status == 1 ? 1 : -1;
                let index = -1;
                for (let i = 0; i < scope.feedback.length; ++i) {
                    if (scope.feedback[i].user === data.user && scope.feedback[i].type === data.type)
                        index = i;
                }

                let result = Boolean(data.status);
                if (result && index < 0)
                    scope.feedback.push(newData);
                else if (!result && index >= 0)
                    scope.feedback.splice(index, 1);

                if(scope.feedback.length === 0)
                    scope.showFeedBack = false;
            };

            scope.$on('likeFinished', function (event, data) {
                if (scope.item.work._id !== data.work)
                    return;
                if (data.success) {
                    scope.item.work.liked = data.liked;
                    scope.item.work.visitorLiked = data.visitorLiked;
                    scope.liked = data.status;
                    scope.updateFeedBackData(data);
                }
            });

            scope.$on('bookmarkFinished', function (event, data) {
                if (scope.item.work._id !== data.work)
                    return;
                if (data.success) {
                    scope.item.work.bookmarked = data.bookmarked;
                    scope.bookMarked = data.status;
                    scope.updateFeedBackData(data);
                }
            });

            scope.$on('tellYes', function (event, data) {
                let index = [5];
                if(index.indexOf(scope.status) === -1)
                    return;
                if (scope.status === 5 && data.signal !== 'deleteChapter' + scope.item.chapter._id + scope.item.infoType)
                    return;
                let emitData = {infoType: scope.item.infoType, index: scope.item.index};
                if (scope.status === 5)
                    scope.$emit('deleteReceivedList', emitData);
                scope.status = 1;
            });
        }
    }
});