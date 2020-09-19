app.service('boardManager',function($http,$rootScope){
    let manager = this;
    this.requestAll = function(site,info,data,ifInfoReceived){
        $http.post(site,{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(ifInfoReceived)
                        $rootScope.$broadcast(receivedData.message,receivedData);
                    else
                        $rootScope.$broadcast(info,receivedData);
                },
                function(err){
                    $rootScope.$broadcast(info,{success:false,info:'网络通信错误，请刷新页面尝试'});
                });
    };

    this.requestThreads = function(data){
        manager.requestAll('/board/threads','threads requested finished',data);
    };

    this.submitNewThread = function(data){
        manager.requestAll('/board/submitThread','new thread submitted',data);
    }

    this.submitNewReply = function(data){
        manager.requestAll('/board/submitReply','new reply submitted',data);
    };

    this.deleteThread = function(data){
        manager.requestAll('/board/deleteThread','thread deleted',data);
    };

    this.deleteReply = function(data){
        manager.requestAll('/board/deleteReply','reply deleted',data);
    };

    this.hideContents = function(data){
        manager.requestAll('/board/hideContents','board contents hide',data);
    };

    this.blockUser = function(data){
        manager.requestAll('/board/blockUser','user blocked',data);
    };

    this.updateMessage = function(data){
        manager.requestAll('/board/updateMessage','message updated',data);
    }
});