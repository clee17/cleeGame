app.service('userManager',function($http,$rootScope,LZString){
    this.saveSettings = function(data){
        $http.post('/settings/save',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let data = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(data.success)
                        $rootScope.$broadcast('settingsSaveFinished',data);
                    else
                        $rootScope.$broadcast('settingsSaveFinished',{message:data.message});
                },
                function(err){
                    $rootScope.$broadcast('settingsSaveFinished',{message:'网络通信错误，请刷新页面尝试'});
                });
    };

    this.requestDashboard = function(data,userId){
        data.userId = userId;
        $http.post('/users/request/dashboard',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(receivedData.success)
                        $rootScope.$broadcast(receivedData.message,receivedData);
                    else
                        $rootScope.$broadcast(receivedData.message,receivedData);
                },
                function(err){
                    console.log(err);
                    $rootScope.$broadcast('dashboardRequestFinished',{success:false,info:'网络通信错误，请刷新页面尝试'});
                });
    };

    this.requestCalculate = function(data){
        $http.post('/users/request/calculate',{data:LZString.compressToBase64(JSON.stringify(data))})
            .then(function(response){
                    let receivedData = JSON.parse(LZString.decompressFromBase64(response.data));
                    if(receivedData.success)
                        $rootScope.$broadcast(receivedData.message,receivedData);
                    else
                        $rootScope.$broadcast(receivedData.message,receivedData);
                },
                function(err){
                    $rootScope.$broadcast('userCalculationEnded',{success:false,info:'网络通信错误，请刷新页面尝试'});
                });
    }
});