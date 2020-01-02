app.service('gameManager',function($http,LZString,$rootScope){
    let gameManager = this;
    this.isRequesting = false;

    this.requestPreview = function(){
        if(gameManager.isRequesting)
            return;
        gameManager.isRequesting = true;
        $http.get($rootScope.gameLink+'/js/Scene_Title.js')
            .then(function(response){
                if(response.status < 400)
                {
                    $rootScope.$broadcast('gamePreviewInfoSuccess');
                }
                else
                    throw response.data;
            })
            .catch(function(e){
                if(e.message)
                    e = e.message;
                $rootScope.$broadcast('gamePreviewInfoError');
            })
    }
});


app.service('chapterManager',function($http,LZString,$rootScope){
    let chapManager = this;
    this.isRequesting = false;

    this.likeIt = function(){
        if(chapManager.isRequesting)
            return;
        chapManager.isRequesting = true;
        data = {
            _id:$rootScope.current._id
        };

        $http.post('/works/likeIt/',{meta:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                $rootScope.ifLiked = response.data.liked;
                if('likeCount' in response.data && $rootScope.current._id === response.data._id){
                    $rootScope.current.liked = response.data.likeCount;
                }
                chapManager.isRequesting = false;
                $rootScope.$broadcast('chapterManagerLikeItError',{message:response.data.message,_id:response.data._id});
                if(response.data.status != 500)
                {
                    throw response.data;
                }
            })
            .catch(function(err){
                chapManager.isRequesting = false;
                if(!err.message)
                    err.message = err;
                $rootScope.$broadcast('chapterManagerLikeItError',{message:err.message,_id:err._id});
            });
    };

    this.cancelLike = function(){
        if(chapManager.isRequesting)
            return;
        chapManager.isRequesting = true;
        data = {
            _id:$rootScope.current._id
        };
        $http.post('/works/cancelLike/',{meta:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                $rootScope.ifLiked = response.data.liked;
                if('likeCount' in response.data && $rootScope.current._id === response.data._id)
                {
                    $rootScope.current.liked = response.data.likeCount;
                }
                chapManager.isRequesting = false;
                $rootScope.$broadcast('chapterManagerLikeItError',{message:response.data.message,_id:response.data._id});
                if(response.data.status != 500)
                {
                    throw response.data;
                }
            })
            .catch(function(err){
                chapManager.isRequesting = false;
                if(!err.message)
                    err.message = err;
                $rootScope.$broadcast('chapterManagerLikeItError',{message:err.message,_id:err._id});
            });
    };

    this.prevChapter = function(){
        if(chapManager.isRequesting)
            return;
        if($rootScope.current && $rootScope.current.prev)
            chapManager.jumpToPage({_id:$rootScope.current.prev});
    };

    this.nextChapter = function(){
        if(chapManager.isRequesting)
            return;
        if($rootScope.current && $rootScope.current.next)
            chapManager.jumpToPage({_id:$rootScope.current.next});
    };

    this.jumpToPage = function(data){
        if(chapManager.isRequesting)
            return;
        chapManager.isRequesting = true;
        let currentSave = $rootScope.current;
        $rootScope.current = null;
        $http.post('/works/toChapter/',{meta:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                chapManager.isRequesting = false;
                response.data = JSON.parse(LZString.decompressFromBase64(response.data));
                if(response.data.current && response.data.status == 500)
                {
                    $rootScope.ifLiked = response.data.ifLiked;
                    $rootScope.current =  response.data.current;
                    var id = window.location.pathname.substring(7);
                    if(id.slice(-1) == '/')
                        id = id.substring(0,id.length-1);
                    if($rootScope.current._id)
                        document.cookie=id+'='+$rootScope.current._id;
                    window.scrollTo(0,0);
                }
                else{
                    if(!response.message)
                        response.message = '没有找到该页面';
                    throw response;
                }
            })
            .catch(function(err){
                chapManager.isRequesting = false;
                $rootScope.current = currentSave;
                $rootScope.$broadcast('chapterManagerError',{message:err.message});
            });
    };
});

app.controller("indexControl",function($scope,$rootScope){
    $scope.colorSave = ['','','',''];

    $scope.onHover = function($event,index){
        if($rootScope.status != 0)
            return;

        $scope.colorSave[index-1] = $event.target.style.background;
        $event.target.style.background = $rootScope.colorSchemaLighten[index-1];
    };

    $scope.onLeave = function($event,index){
        $event.target.style.background = $scope.colorSave[index-1];
    };

    $scope.onSelectTab = function(id,colorIndex){
        var index=  colorIndex;

        if($scope.status ==0){
            var ele = document.getElementById(id);
            if(ele)
            {
                ele.style.setProperty('transform-origin','0 '+(3+2.5*index)+'rem');
                ele.style.setProperty('animation-delay','0.1s');
                ele.style.setProperty('animation','show 0.5s 1');
                ele.style.setProperty('animation-fill-mode','forwards');
                document.getElementById('infoBack').style.setProperty('animation','fadeIn 0.05s 1');
                document.getElementById('infoBack').style.setProperty('animation-fill-mode','forwards');
            }

            $rootScope.status = index;
            document.getElementById('infoBack').style.setProperty('pointer-events','all');
            document.getElementsByTagName("body")[0].style.setProperty('--pageColor',$rootScope.colorSchema[index-1]);
            $scope.refreshPageButton(index-1,'darken');
        }
    };

    $scope.$on('showFloatPage',function(event,data){
        $scope.onSelectTab(data.id,data.colorIndex);
    });

    $scope.refreshPageButton = function(index,anim){
        let elements = document.getElementsByClassName('leftBtn');

        for(var i=0; i<elements.length;++i)
        {
            if(index == i)
                continue;
            else{
                elements[i].style.setProperty('animation',anim+' 0.5s 1');
                elements[i].style.setProperty('animation-fill-mode','forwards');
            }
        }
    };

    $scope.$on('refreshButtons',function(event,data){
        $scope.refreshPageButton(data.index,data.anim);
    });
});



app.controller('workIndexControl',function($scope){

    $scope.volumeCount = 0;

    $scope.volumeTotal = function(){
        return $scope.volumeCount;
    };

    $scope.addVolumeTotal = function(){
        $scope.volumeCount++;
    };
});



app.controller('contentsControl',function($scope,$rootScope){
    $scope.$watch('current',function(){
        if(!$rootScope.current)
        {
            $rootScope.requesting = true;
            return;
        }
        $rootScope.current.date = new Date($rootScope.current.date);
        $rootScope.requesting = false;
        if($rootScope.current.type==3005)
        {
            document.getElementById('contentsInBoard').innerHTML=$rootScope.current.contents;
            document.getElementById('mainWorksBoard').style.setProperty('height','auto');
        }
    });

    $scope.likeItResposne = '';


    $scope.showComment = function(){
        $rootScope.$broadcast('showFloatPage',{id:'worksComment',colorIndex:2});
    };

    $scope.$on('chapterManagerLikeItError',function(event,data){
        if($rootScope.current._id == data._id)
            $scope.likeItResponse = data.message;
    });
});

app.controller("gameInfoControl",function($scope,$rootScope,gameManager){
   $scope._attempted = 0;
   $scope._maxAttempted = 3;
   $scope.showInfo = $rootScope.gameLink != ''? '预览加载中':'游戏尚在开发中';
   $scope.loading = $rootScope.gameLink != '' ? true: false;
    $scope.loading = false;
   $scope._gameExist = false;

   let loadGame = function(){
       $scope.loading = true;
       let protonScript = document.createElement('script');
       protonScript.src = '/lib/proton.min.js';
       protonScript.type = "text/javascript";
       document.body.appendChild(protonScript);
       let script = document.createElement('script');
       script.src = 'https://cdn.jsdelivr.net/npm/pixi.js@5.2.0/lib/pixi.min.js';
       script.type = "text/javascript";
       script.onload = function(){
               gameManager.requestPreview();
       };
       document.body.appendChild(script);

       $scope.$on('gamePreviewInfoError',function(event,data){
           $scope.loading = false;
           $scope.showInfo = '游戏预览尚在开发中';
       });

       $scope.$on('gamePreviewInfoSuccess',function(event,data){
           $scope.loading = false;
           if(typeof Graphics !== 'undefined')
           {
               $scope._gameExist = true;
               let node = document.getElementById('worksGameView');
               Graphics.initialize(node);
               let script = document.createElement('script');
               script.src=$rootScope.gameLink+'/js/Scene_Title.js';
               script.type = "text/javascript";
               document.body.appendChild(script);
           }
       });
   };

   if($rootScope.gameLink != '')
       loadGame();

});