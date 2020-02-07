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
            scope.commentParent = null;
            scope.currentComment = '';
            scope.type = Number(attr.type);
            scope.liked = false;
            scope.bookMarked = false;
            scope.requestingComment = false;
            if (scope.item.work.feedback) {
                let feedback = scope.item.work.feedback;
                feedback.forEach(function (item) {
                    if (item.type == 1)
                        scope.liked = Boolean(item.status);
                    else if (item.type == 2)
                        scope.bookMarked = Boolean(item.status);
                })
            }

            scope.feedback = scope.item.work.feedbackAll || [];
            scope.workType = 1;
            if (scope.item.work.chapterCount <= 1 && scope.item.work.status == 0)
                scope.workType = 0;
            if (scope.item.infoType == 0)
                scope.item.user = scope.item.work.user;
            else
                scope.item.user = scope.item.chapter.user;
            scope.type = Number(scope.type && scope.workType);


            scope.getParentUser = function(parent){
                     scope.item.commentList.forEach(function(comment){
                         if(comment._id == parent)
                             return comment.userName;
                     })
            };

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

            scope.deleteComment = function(comment){
                let alertInfo = ["您是否确定要删除本条来自"+comment.userName+"的评论？"];
                let data = {alertInfo: alertInfo};
                data.signal = 'deleteComment' + scope.item.chapter._id + scope.item.infoType;
                data.variables = {id:comment._id};
                scope.$emit('showAlert', data);
                scope.status = 8;
            };

            scope.deleteCommentById = function(commentId){
                feedbackManager.deleteComment({_id:commentId,work:scope.item.work._id,chapter:scope.item.chapter._id,infoType:scope.item.infoType});
            };

            scope.sendComment = function () {
                let matched = false;
                if ($rootScope.readerId.match(/^[0-9a-fA-F]{24}$/))
                    matched = true;
                let error = null;
                if (matched && scope.currentComment.length == 0)
                    error = '作为注册用户，您的留言不能为空';
                else if (!matched && scope.currentComment.length < 15)
                    error = '作为非注册用户，您的留言不能少于15字';
                if (error != null) {
                    scope.$emit('showError', {error: error});
                    return;
                }
                let data = {
                    infoType: scope.item.infoType,
                    contents: scope.currentComment,
                    workId: scope.item.work._id,
                    chapterId: scope.item.chapter._id,
                    parent: scope.commentParent,
                    targetUser: scope.item.chapter.user,
                    necc: 'adw320931456t_e',
                    readerId: $rootScope.readerId,
                    visitorId: $rootScope.visitorId
                };
                feedbackManager.postComment(data);
                scope.requestingComment = true;
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

            scope.$on('commentFinished', function (event, data) {
                scope.requestingComment = false;
                if (scope.item.work._id !== data.work)
                    return;
                if (scope.item.infoType !== data.infoType)
                    return;
                if (data.chapter != null && data.chapter !== scope.item.chapter._id)
                    return;
                scope.currentComment = '';
                if (data.success) {
                    scope.item.commentList.unshift(data.doc);
                    if (scope.item.infoType === 0)
                        scope.item.work.comments = data.commentCount;
                    else if (scope.item.infoType === 1)
                        scope.item.chapter.comments = data.commentCount;
                } else {
                    console.log(data.message);
                }
            });

            scope.$on('deleteCommentFinished',function(event,data){
                if (scope.item.work._id !== data.work)
                    return;
                if (scope.item.chapter._id !== data.chapter)
                    return;
                if (scope.item.infoType !== data.infoType)
                    return;
                if(data.success)
                {
                    for(let i=0;i<scope.item.commentList.length;++i)
                    {
                        if(scope.item.commentList[i]._id === data._id)
                        {
                            scope.item.commentList.splice(i,1);
                            break;
                        }
                    }
                    console.log(data.commentCount);
                    if (scope.item.infoType === 0)
                        scope.item.work.comments = data.commentCount;
                    else if (scope.item.infoType === 1)
                        scope.item.chapter.comments = data.commentCount;
                }
                else
                {
                    console.log(data);
                }
            });

            scope.$on('tellYes', function (event, data) {
                let index = [5,8];
                if(index.indexOf(scope.status) == -1)
                    return;
                if (scope.status === 5 && data.signal !== 'deleteChapter' + scope.item.chapter._id + scope.item.infoType)
                    return;
                if (scope.status === 8 && data.signal !== 'deleteComment' + scope.item.chapter._id + scope.item.infoType)
                    return;
                let emitData = {infoType: scope.item.infoType, index: scope.item.index};
                if (scope.status === 5)
                    scope.$emit('deleteReceivedList', emitData);
                else if(scope.status === 8)
                    scope.deleteCommentById(data.variables.id);
                scope.status = 1;
            });
        }
    }
});