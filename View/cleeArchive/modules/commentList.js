app.directive('commentWindow',function($rootScope) {
    return {
        restrict: "C",
        link:function(scope,element,attr) {
            element.on('input',function(){
                let sb = element[0].previousElementSibling;
                if(sb.scrollHeight - sb.offsetHeight >= 5)
                    element.css('height',(sb.scrollHeight-20)+'px');
                else
                    element.css('height',(sb.offsetHeight-20)+'px');
            })
        }
    }
});

app.directive('commentInfo',function($compile,$rootScope,feedbackManager) {
    return {
        restrict: "E",
        templateUrl:'/view/modules/commentList.html',
        link:function(scope,element,attr) {
            scope.comment = '';
            scope.parent = null;

            if(scope.initializeCommentData)
                 scope.initializeCommentData();
            else{
                scope.workId = '';
                scope.chapterId = '';
                scope.infoTYpe = '';
                scope.targetUser = '';
                scope.userId = '';
            }

            scope.getParentUser = function(parent){
                scope.commentList.forEach(function(comment){
                    if(comment._id === parent)
                        return comment.userName;
                })
            };

            scope.sendComment = function () {
                let matched = false;
                if ($rootScope.readerId.match(/^[0-9a-fA-F]{24}$/))
                    matched = true;
                let error = null;
                if(scope.comment.length === 0)
                    error = '您的留言不能为空';
                else if (matched && scope.comment.length === 0)
                    error = '作为注册用户，您的留言不能为空';
                else if (!matched && scope.comment.length < 15)
                    error = '作为非注册用户，您的留言不能少于15字';
                if (error != null) {
                    scope.$emit('showError', error);
                    return;
                }
                let data = {
                    infoType: scope.infoType,
                    contents: scope.comment,
                    workId: scope.workId,
                    chapterId: scope.chapterId,
                    parent: scope.parent,
                    targetUser: scope.targetUser,
                    necc: 'adw320931456t_e',
                    readerId: $rootScope.readerId,
                    visitorId: $rootScope.visitorId
                };
                feedbackManager.postComment(data);
                scope.requestingComment = true;
            };

            scope.$on('commentFinished', function (event, data) {
                scope.requestingComment = false;
                if (scope.workId !== data.work)
                    return;
                if (scope.infoType !== data.infoType)
                    return;
                if (data.chapter != null && data.chapter !== scope.chapterId)
                    return;
                if (data.success) {
                    scope.comment = '';
                    scope.commentList.unshift(data.doc);
                    scope.updateCommentCount(data);
                } else {
                    scope.$emit('showError',data.message);
                }
            });

            scope.$on('deleteCommentFinished',function(event,data){
                if (scope.workId !== data.work)
                    return;
                if (scope.chapterId !== data.chapter)
                    return;
                if (scope.infoType !== data.infoType)
                    return;
                if(data.success)
                {
                    for(let i=0;i<scope.commentList.length;++i)
                    {
                        if(scope.commentList[i]._id === data._id)
                        {
                            scope.commentList.splice(i,1);
                            break;
                        }
                    }
                    scope.updateCommentCount(data);
                }
                else
                {
                    scope.$emit('showError', data.message);
                }
            });

            scope.deleteComment = function(comment){
                let alertInfo = ["您是否确定要删除本条来自"+comment.userName+"的评论？"];
                let data = {alertInfo: alertInfo};
                data.signal = 'deleteComment' + scope.chapterId + scope.infoType;
                data.variables = {id:comment._id};
                scope.$emit('showAlert', data);
                scope.status = 8;
            };

            scope.deleteCommentById = function(commentId){
                feedbackManager.deleteComment({_id:commentId,work:scope.workId,chapter:scope.chapterId,infoType:scope.infoType});
            };


            scope.$on('tellYes', function (event, data) {
                if(scope.status !== 8)
                    return;
                if (scope.status === 8 && data.signal !== 'deleteComment' + scope.chapterId + scope.infoType)
                    return;
               if(scope.status === 8)
                    scope.deleteCommentById(data.variables.id);
                scope.status = 1;
            });
        }
    }
});