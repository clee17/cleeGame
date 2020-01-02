app.service('fanficManager',function($http,$rootScope,LZString){
    let manager =this;

    this.requestFanfic = function(currentIndex){
        $http.post('/fanfic/post/loadChapter',{data:LZString.compressToBase64(JSON.stringify(currentIndex))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('fanficReceived',data);
                else
                    $rootScope.$broadcast('fanficReceived',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('fanficReceived',{success:false,message:'网络通信错误'});
            });
    };

    this.preview = function(data){
        $http.post('/fanfic/post/previewRequest',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('preview ready',{success:true,message:'通信成功'});
                else
                    $rootScope.$broadcast('preview ready',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('preview ready',{success:false,message:'网络通信错误'});
            });
    };

    this.publish = function(bookInfo,chapterInfo,bookIndex,ifAll){
        let data = {book:bookInfo,chapter:chapterInfo,index:bookIndex,ifAll:ifAll};
        $http.post('/fanfic/post/publish',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('publish finished',data);
                else
                    $rootScope.$broadcast('Publish finished',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('publish finished',{success:false,message:'网络通信错误'});
            });
    };

    this.saveBook = function(bookData)
    {
        $http.post('/fanfic/book/save',{data:LZString.compressToBase64(JSON.stringify(bookData))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('bookSaved',data);
                else
                    $rootScope.$broadcast('bookSaved',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('bookSaved',{success:false,message:'网络通信错误'});
            });
    };

    this.saveFanfic = function(fanficData)
    {
        $http.post('/fanfic/chapter/save',{data:LZString.compressToBase64(JSON.stringify(fanficData))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('chapterSaved',data);
                else
                    $rootScope.$broadcast('chapterSaved',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('chapterSaved',{success:false,message:'网络通信错误'});
            });
    };

    this.addChapter = function(indexData){
        $http.post('/fanfic/chapter/add',{data:LZString.compressToBase64(JSON.stringify(indexData))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('chapterAdded',data);
                else
                    $rootScope.$broadcast('chapterAdded',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('chapterAdded',{success:false,message:'网络通信错误'});
            });
    };

    this.removeChapter = function(indexData){
        $http.post('/fanfic/chapter/remove',{data:LZString.compressToBase64(JSON.stringify(indexData))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(data.success)
                    $rootScope.$broadcast('chapterRemoved',data);
                else
                    $rootScope.$broadcast('chapterRemoved',{success:false,message:data.message});
            },function(err){
                $rootScope.$broadcast('chapterRemoved',{success:false,message:'网络通信错误'});
            });
    };

    this.saveInfo = function(bookData,fanficData)
    {
        manager.saveBook(bookData);
        manager.saveFanfic(fanficData);
    }
});