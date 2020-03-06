app.service('fanficManager',function($http,$rootScope){
    let manager =this;

    this.request = function(site,info,data,ifInfoReceived){
        $http.post(site,{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(ifInfoReceived)
                        $rootScope.$broadcast(receivedData.message,receivedData);
                    else
                        $rootScope.$broadcast(info,receivedData);
                },
                function(err){
                    console.log(err);
                    $rootScope.$broadcast(info,{success:false,info:'网络通信错误，请刷新页面尝试'});
                });
    };

    this.requestFanfic = function(currentIndex){
        manager.request('/fanfic/post/loadChapter','fanficReceived',currentIndex);
    };

    this.preview = function(data){
        manager.request('/fanfic/post/previewRequest','preview ready',data);
    };

    this.publish = function(bookInfo,chapterInfo,bookIndex,ifSingle){
        let data = {book:bookInfo,chapter:chapterInfo,index:bookIndex,ifSingle:ifSingle};
        manager.request('/fanfic/post/publish','publish finished',data);
    };

    this.saveBook = function(bookData)
    {
        manager.request('/fanfic/book/save','bookSaved',bookData);
    };

    this.saveFanfic = function(fanficData)
    {
        manager.request('/fanfic/chapter/save','chapterSaved',fanficData);
    };

    this.addChapter = function(indexData){
        manager.request('/fanfic/chapter/add','chapterAdded',indexData);
    };

    this.removePost = function(indexData){
        manager.request('/fanfic/post/delete','postRemoved',indexData);
    };

    this.removeChapter = function(indexData){
        manager.request('/fanfic/chapter/remove','chapterRemoved',indexData);
    };

    this.swapChapter = function(indexData){
        manager.request('/fanfic/chapter/swap','chapterSwapped',indexData);
    };

    this.changeGrade = function(data){
        manager.request('/fanfic/change','gradeChangeFinished',data);
    }
});