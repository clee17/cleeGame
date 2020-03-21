app.service('gameManager',function($http,$rootScope){
    let manager =this;

    this.addNewGame = function(data){
        $http.post('/games/admin/addGame',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                 $rootScope.$broadcast('newGameAddFinished',data);
            },function(err){
                $rootScope.$broadcast('newGameAddFinished',{success:false,message:'网络通信错误'});
            });
    };

    this.requestAllGameList = function(data){
        $http.post('/games/admin/gameList',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                let data = JSON.parse(LZString.decompressFromBase64(response.data));
                $rootScope.$broadcast('refreshAllGameList',data);
            },function(err){
                $rootScope.$broadcast('refreshAllGameList',{success:false,message:'网络通信错误'});
            });
    };
});

app.directive('errorBox',function($timeout){
    return {
        restrict: 'C',
        scope:{

        },
        link:function(scope,element,attr){
            scope.$on('showError',function(event,data){
                let startFunction = function(){
                    scope.showError= true;
                    element.html(' <i style="color:red" class="fas exclamation-circle fa-2x"></i><div style="margin-top:auto;margin-bottom:auto;margin-left:1rem;">'+data+'</div>');
                    element.css('display','flex');
                    element.css('opacity','1');
                    element.css('transition','opacity 1s ease-in');
                    $timeout(function(){
                        element.css('transition','opacity 1s ease-out');
                        element.css('opacity','0');
                        $timeout(function(){
                            scope.showError = false;
                            element.css('display','none');
                        },1000);
                    },500);
                };
                if(data)
                    $timeout(startFunction,100);
            });
        }
    }
});

app.controller("gameAdminCon",['$location','$scope','$rootScope','$timeout','$interval','gameManager',function($location,$scope,$rootScope,$timeout,$interval,gameManager){
    $scope.page = '';
    $scope.pageId = $location.search().id ||1;
    $scope.perPage = 35;
    $scope.showPanel = false;
    $scope.requesting = false;
    $scope.receivedList = [];
    $scope.attributes = [];
    $scope.gameTypes  = [
        {refer:'文字冒险',type:1000},
        {refer:'策略养成',type:1001},
        {refer:'其他',type:-1}
    ];
    $scope.resolutions = [
        {refer:'1280X720',width:1280,height:720},
        {refer:'860X640',width:860,height:640},
        {refer:'540X960',width:540,height:960},
        {refer:'other',width:-1,height:-1}
    ];
    $scope.modules = [
        {refer:'文字冒险模块',code:2000},
        {refer:'瓷砖地图模块',code:2001}
    ];

    $scope.initGameSubmit = function(){
        if(window.localStorage)
        {
           let localItem =  window.localStorage.getItem('gameSubmit');
           if(localItem)
           {
               $scope.gameSubmit = JSON.parse(LZString.decompress(localItem));
               return;
           }
        }
        $scope.gameSubmit = {
            title:'',
            version:{root:1,sub:0,branch:0},
            gameType:$scope.gameTypes[0],
            path:'',
            resolution:$scope.resolutions[0],
            exchangeRate:'100',
            tempModule:{refer:'nothing',code:-1},
            modules:[],

        };
    };

    $scope.requestAdd = function(){
        let showNewGame = function(){
            $scope.initGameSubmit();
            let newPanel = document.getElementById('addPanel');
            newPanel.style.height = 'auto';
            newPanel.style.width = '22rem';
            newPanel.style.padding = '1.5rem';
            $scope.showPanel = true;
        };
        switch($scope.page)
        {
            case 'gameList':
                showNewGame();
                break;

        }
    };

    $scope.hideNewGame = function(){
        let newPanel = document.getElementById('addPanel');
        newPanel.style.width = '1px';
        newPanel.style.padding = '0';
        $timeout(function(){
            $scope.showPanel = false;
            $scope.gameSubmit = null;
        },100);
    };

    $scope.cancelAdd = function(){
        switch($scope.page)
        {
            case 'gameList':
                $scope.hideNewGame();
                break;

        }
    };

    $scope.autoSave = $interval(function(){
        if($scope.gameSubmit && window.localStorage) {
            window.localStorage.setItem('gameSubmit',LZString.compress(JSON.stringify($scope.gameSubmit)));
         };
    },1000*15);

    $scope.validateGameSub=  function(){
        let errorMessage = null;
        $scope.gameSubmit.finalVersion = $scope.gameSubmit.version.root+'.'+$scope.gameSubmit.version.sub+'.'+$scope.gameSubmit.version.branch;
        if($scope.gameSubmit.title.length === 0)
            errorMessage = '游戏名称不能为空';
        else if($scope.gameSubmit.path.length ===0)
            errorMessage = '游戏路径不能为空';
        else if($scope.gameSubmit.path.indexOf('/') ===0)
            errorMessage = '游戏路径不能以/开头';
        else if(!$scope.gameSubmit.finalVersion.match(/^[1-9][0-9]*.[0-9]+.[0-9]+$/))
            errorMessage = '游戏版本号必须是数字';
        else if(!$scope.gameSubmit.exchangeRate || $scope.gameSubmit.exchangeRate.length ===0)
            errorMessage = '您必须输入积分兑换汇率';
        else if(!$scope.gameSubmit.exchangeRate.match(/^[1-9][0-9]*$/))
            errorMessage = "积分兑换汇率必须是数字";
        else if($scope.gameSubmit.resolution.width ===0 || $scope.gameSubmit.resolution.height ===0 )
            errorMessage = '游戏视窗的宽高不能为0';
        else if($scope.gameSubmit.description === "")
            errorMessage = '游戏版本说明不能为空';

        if(errorMessage !== null) {
            $rootScope.$broadcast('showError',errorMessage);
            return false;
        }
        else
            return true;
    };

    $scope.submitResult  = function(){
        if($scope.page === 'gameList')
        {
            if(!$scope.validateGameSub())
                return;
            else {
                gameManager.addNewGame($scope.gameSubmit);
                $scope.gameSubmit = null;
                $scope.requesting = true;
                $scope.hideNewGame();

            }

         }
    };

    $scope.$on('newGameAddFinished',function(event,data){
        $scope.requesting = false;
        if(data.success)
        {
            $scope.receivedList.push(JSON.parse(JSON.stringify(data.doc)));
            $scope.hideNewGame();
            window.localStorage.removeItem('gameSubmit');
        }
        else
        {
            $rootScope.$broadcast('showError',data.message);
        }
    });

    $scope.$on('refreshAllGameList',function(event,data){
        $scope.requesting = false;
        if(data.success)
        {
            $scope.receivedList = JSON.parse(JSON.stringify(data.docs));
            if($scope.receivedList === 0)
                $rootScope.$broadcast('showError','数据库中没有记录');
        }
        else
            $rootScope.$broadcast('showError',data.message);
    });

    let initializeGameList = function(){
        $scope.page = 'gameList';
        $scope.attributes = ['_id','游戏名称','当前版本','积分汇率','版本说明','加载模块'];
        $scope.requesting = true;
        gameManager.requestAllGameList({pageId:$scope.pageId,perPage:$scope.perPage});
    };

    switch($location.search().id)
    {
        case 0:
            initializeGameList();
            break;
        default:
            initializeGameList();
            break;
    }



}]);