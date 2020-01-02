//路径名是相对于项目根路径的；
app.config(function($routeProvider){
   $routeProvider
       .when('/pleaseLogin',{
           controller:'logCon',
           templateUrl:'/View/templates/login.html'
       })
       .when('/home',{
           controller:'homeCon',
           templateUrl:'/View/templates/welcome.html'
       })
       .when('/database',{
           controller:'dataBaseCon',
           templateUrl:'/view/templates/dataBase.html'
       })
       .when('/userInfo',{
           controller:'userInfoCon',
           templateUrl:'/view/templates/userInfo.html'
       })
});

app.controller("rootCon",async function($scope,$http,$rootScope,$location,_userLog){
    $rootScope.title = "Memoria Admin";
    $rootScope.headOptions = [
        {
            title:'用户信息',
            link:function(){
            }
        },
        {
            title:'数据库',
            link:function(){

            }
        }];

    $rootScope.lastOption={
        title:'',
        link:function(){
            $location.path('/pleaseLogin');
        }
    };

    $rootScope.logged = function(){
        return _userLog.logged;
    };

    let response = await $http.get('/memoria/admin/serial/',null);
    if(response.status<400)
        $rootScope.signature = response.data;

    _userLog.checkStatus($rootScope.signature);

    if(_userLog.logged)
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


app.controller("homeCon",function($scope,$http,$rootScope){

});

app.controller("dataBaseCon",function($scope,$rootScope){
    $scope._dataBaseFiles ={};
    $scope.currentName = '';

    $scope.addEntry = function(filename,record){
        $http.post('/memoria/data/add/'+filename, {data:str}).then(
            ()=>{
                console.log("success sent");
            },
            err=>{
                console.log("failed to send");
            });
    };

    $scope.deleteEntry = function(filename,id){
        $http.post('/memoria/data/delete/'+filename, {data:{id:id}}).then(
            ()=>{
                console.log("success sent");
            },
            err=>{
                console.log("failed to send");
            });
    }
});

app.controller('userInfoCon',function($scope,$rootScope){

});