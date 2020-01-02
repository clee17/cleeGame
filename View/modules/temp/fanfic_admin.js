app.config(function($routeProvider,$locationProvider){
    $routeProvider
        .when('/',{
            controller:'mainCon',
            templateUrl:''
        })
        .when('/data',{
            controller:'dataCon',
            templateUrl:'/templates/data.html'
        })
        .otherwise('/',{
           controller:'mainCon',
           templateUrl:''
        });
    $locationProvider.html5Mode(true);
});

app.service('_config',function($rootScope,_userLog,$route,$window,$location,_utilityBasic){
    this.requested = 0;
    this.preset = function()
    {
        if($rootScope.backToMain != undefined)
            return;

        $rootScope.backToMain = function(){
            $route.go('/');
        };

        $rootScope.logged = function(){
            return _userLog.logged();
        };

        $rootScope.resetInfo = function(){
            $rootScope.$broadcast("info_hide",function(e,data){});
        };

        $rootScope.showInfo = function(){
            $rootScope.$broadcast('info_show',function(event,data){});
        };

        $rootScope.endValidate = function(){
            $rootScope.$broadcast('validate_end',function(event,data){});
        };

        $rootScope.failValidate = function(){
            if(_userLog.status<400)
                _userLog.status = 502;
            $rootScope.$broadcast('validate_fail',function(event,data){});
        };
    };

    this.validateStatus = function(){
        _userLog.validate()
            .then(function(res){
                console.log('started header copy');
                $rootScope.headOptions.length =0;
                $rootScope.sideOptions.length =0;
                _utilityBasic.deepJsonACopy($rootScope.headOptions,res.headOptions);
                _utilityBasic.deepJsonACopy($rootScope.sideOptions,res.sideOptions);
                for(var i=0;i<$rootScope.headOptions.length;++i)
                {
                    $rootScope.headOptions[i].link=function(){
                        if(this.index != undefined)
                            $location.path('/data').search('index',this.index);
                    }
                }
                $rootScope.$apply();
                $rootScope.endValidate();

            })
            .catch(function(err){
                console.log(err);
                if(this.requested>=3)
                {
                    this.requested = 0;
                    $rootScope.failValidate();
                }
                else {
                    if(this.requested == undefined)
                        this.requested = 0;
                    this.requested++;
                    this.validateStatus();
                }
            });
    };

    this.resetIndex = function(){
        $rootScope.subIndex = 0;
        _userLog._subIndex = 0;
    }
});

app.controller('rootCon',function(_config,$rootScope,_userLog){
   console.log('rootcon entered');
   _config.preset();
   _config.initialize = function()
   {
       if($rootScope.entered)
           return;
       $rootScope.title = 'FanficAdmin';
       $rootScope.page = 101;
       $rootScope.headOptions = [];
       $rootScope.sideOptions = [];
       $rootScope.subIndex = 0;
       $rootScope.lastOption={
           title:'返回首页',
           link:function(){
               $window.location.href = 'http://'+$location.host();

           }
       };

       _userLog._currentPage = $rootScope.page;
       _userLog._subIndex = $rootScope.subIndex;
       _userLog._status  = 0;
       $rootScope.entered = true;
   };

});

app.controller('mainCon',function(_userLog,$rootScope,$scope,_config){
    console.log('mainCon entered');
    $rootScope.resetInfo();
    _config.initialize();
    _config.resetIndex();
    _config.validateStatus();

    $scope.$on("validate_end",function(event,data){
       $rootScope.showInfo();
    });

    $scope.$on("validate_fail",function(event,data){
       $rootScope.showInfo();
    });

});