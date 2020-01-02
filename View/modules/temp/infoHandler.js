app.service('_infoView',function(_utilityBasic,$location,$rootScope,$http){
    this.title=null;
    this.message = null;
    this.options = [];
    this._ready = false;
    this.formatMessage = function(){
        while(this.message.indexOf('\n') != -1)
        {
            var index = this.message.indexOf('\n');
            var message = this.message.split('');
            message.splice(index,2,'</p><p>');
            this.message = message.join('');
        }
        this.message = '<p>'+this.message+'</p>';
    };
    this.requestInfo =async function()
    {
        let data = {};
        data.page = $rootScope.page;
        data.status = $rootScope.status;
        let req = Base64.encode(JSON.stringify(data));
        let response = await $http.post('/admin/info/',{data:req});
        let res = JSON.parse(Base64.decode(response.data.value));

        this.title = res.title;

        this.message = res.message;
        this.formatMessage();

        _utilityBasic.deepJsonACopy(this.options,res.options);

        return true;
    }
});

app.directive("infoPara",function($compile){
    return{
        restrict:"E",
        link : function(scope,element,attr) {
            scope.$watch("message",function(){
                var ele = $compile(scope.message)(scope);
                element.append(ele);
            });
        }}
});

app.controller("infoCon",function($scope,$http,$rootScope,$window,$location,_userLog,_infoView,_utilityBasic) {
    if($rootScope.status == 0)
    {
        $location.path('/');
        return;
    }
    $scope.message = "<p></p>";
    $scope.info_title = null;
    $scope.optoins = [];

    _infoView.requestInfo()
        .then(function(res){
            if(res) {
                $scope.info_title = _infoView.title;
                $scope.message = _infoView.message;
                $scope.options = [];
                let callBack  =  function(){
                    if(this.func.indexOf('function:')!=-1)
                    {eval(this.func.slice(9))};
                };
                _utilityBasic.deepJsonACopy($scope.options,_infoView.options,[{"name":"link","func":callBack}]);
                $scope.$apply();
            }
            else
                throw 'not return data from info';

        })
        .catch(function(err){
            console.log(err);
            $scope.info_title = "Sorry";
            $scope.message= "<p>It seems that there is something wrong happend to the page, please kindly try again later.</p>"
            $scope.options = [
                {
                    "name":"return",
                    "link":function(){
                        $window.location.href = 'http://'+$location.host();
                    }
                }
            ];
            $scope.$apply();
        });
});