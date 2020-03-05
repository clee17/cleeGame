app.service('userManager',function($http,$rootScope){
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

    this.saveSettings = function(data){
        manager.requestAll('/settings/save','settingsSaveFinished',data);
    };

    this.savePreference = function(data){
        manager.requestAll('/settings/savePreference','preferenceSaveFinished',data);
    };

    this.requestDashboard = function(data,userId){
        data.userId = userId;
        manager.requestAll('/users/request/dashboard','dashboardRequestFinished',data,true);
    };

    this.requestCalculate = function(data){
        manager.requestAll('/users/request/calculate','userCalculationEnded',data,true);
    };

    this.requestApplication = function(data){
        manager.requestAll('/user/apply','applicationEnded',data);
    };

    this.saveBasicInfo = function(data){
        manager.requestAll('/user/saveInfo','basicInfoSaveFinished',data);
    };

    this.requestBill = function(data){
        manager.requestAll('/user/requestBill','requestBillFinished',data);
    };

    this.reloadSettings = function(){
        manager.requestAll('/users/settings/reload','requestSettingFinished',{});
    };

    this.submitRegisterRequest = function(data){
        manager.requestAll('/user/registerRequest','requestRegisterFinished',data);
    };

    this.getStatus = function(data){
        manager.requestAll('/user/getStatus','requestStatusFinished',data);
    }
});