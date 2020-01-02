app.config(function($routeProvider){
    $routeProvider
        .when('/pleaseLogin',{
            controller:'logCon',
            templateUrl:'/templates/login.html'
        })
        .when('/home',{
            controller:'homeCon',
            templateUrl:'/templates/welcome.html'
        })
});

app.controller("rootCon",function($scope,$http,$rootScope,$location,_userLog){
    $rootScope.title = "CleeArchive";
    $rootScope.logName = "";
    $rootScope.headOptions = [];
    $rootScope.lastOption={
        title:'',
        link:function(){
            $location.path('/pleaseLogin');
        }
    };

    $rootScope.logged = function(){
        return _userLog.logged();
    };

    _userLog.status();

    $rootScope.lastOption.title = $rootScope.logged() ? '登出': '登入';
    if(_userLog.logged())
    {
        $rootScope.lastOption.title = '登出';
        $location.path('/home');
    }
    else
    {
        $rootScope.lastOption.title = '登入';
        $location.path('/pleaseLogin');
    }
});