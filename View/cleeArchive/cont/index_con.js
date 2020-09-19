app.controller('entryCon',function($scope,$rootScope,$window,$timeout,$cookies,loginManager){
    window.addEventListener("click",function(event){
        if($rootScope._buttonClicked)
            $rootScope._buttonClicked = false;
        else
            $rootScope.$broadcast('clicked',{event:event});
    });

    $rootScope.switchCountryCode = function(countryCode){
        $cookies.putObject('readerLanguage',countryCode);
        $window.location.reload();
    };

    $scope.signal = '';
    $scope.alertData = null;
    $scope.showAlert = false;
    $scope.showError = false;
    $scope.alertValidate = null;

    $scope.hideAlert = function(scope){
        scope.showAlert = false;
    };

    $scope.$on('showAlert',function(event,data){
        $scope.alertWindow = 3;
        $scope.showAlert = true;
        $scope.signal = data.signal || '';
        $scope.alertData = data.variables;
        $scope.alertValidate = data.validate || null;
        let alertInfo = document.getElementById('alertInfo');
        if(alertInfo)
            alertInfo.innerHTML = data.alertInfo || '<span>error</span>';
        let height = data.height || 13;
        $timeout(function(){
            let element = document.getElementById('alertContents');
            if(element){
                element.style.height = height + 'rem';
            }
        },10)
    });

    $scope.$on('showExplain',function(event,data){
        $scope.alertWindow = 1;
        $scope.showAlert = true;
        let showExplain = function(data){
            let explain = document.getElementById('explainBoard');
            $scope.explainConfirm = !!data.selection;
            if(data.selection === undefined)
                $scope.explainConfirm = true;
            if(explain){
                let children = explain.children;
                children[0].innerHTML = '<div style="margin:2rem">'+data.info+'</div>';
                explain.style.height = data.height ? data.height+'rem': '30rem';
            }
        };
        $timeout(showExplain(data),10);
    });

    $scope.$on('showError',function(event,data){
        $scope.showError = true;
        $scope.$broadcast('showErrorText',data);
    });

    $scope.$on('showHeadSign',function(event,data){
        let element = document.getElementById('headSign');
        if(element)
            element.innerHTML = data.message;
    });

    $scope.hideExplain = function(){
        let explain = document.getElementById('explainBoard');
        if(explain){
            explain.style.height = '0';
        }
        $timeout($scope.hideAlert($scope),140);
    };

    $scope.collectFormData = function(response){
        response.formData = {};
        let infoNodes = ['TEXTAREA','INPUT'];
        let element = document.getElementById('alertInfo');
        let children = element.children;
        for(let i=0; i<children.length;++i){
            let subDocs=  children[i].children;
            for(let j =0; j<subDocs.length;++j){
                if(infoNodes.indexOf(subDocs[j].nodeName)>=0)
                    response.formData[subDocs[j].id] = subDocs[j].value;
            }
        }
    };

    $scope.tellYes = function(){
        if($scope.alertValidate && !$scope.alertValidate())
            return;
        let finishTellYes = function(scope,rootScope){
            let response = {signal:scope.signal};
            if(scope.alertData)
                response.variables = scope.alertData;
            scope.collectFormData(response);
            rootScope.$broadcast('tellYes',response);
            scope.hideAlert(scope);
        }
        let element = document.getElementById('alertContents');
        if(element){
            element.style.height = '0';
        }
        $timeout(finishTellYes($scope,$rootScope),140);
    };

    $scope.tellNo = function(){
        let finishTellNo = function(scope,rootScope){
            let response = {signal:scope.signal};
            if(scope.alertData)
                response.variables = scope.alertData;
            rootScope.$broadcast('tellNo',response);
            scope.hideAlert(scope);
        }
        let element = document.getElementById('alertContents');
        if(element){
            element.style.height = '0';
        }
        $timeout(finishTellNo($scope,$rootScope),140);
    };

    $scope.loggingOut = false;
    $scope.freezingClick = false;

    $scope.showDashboard = false;
    $scope.showLoginboard = false;

    $scope.switchDashboard = function(event){
        $scope.showDashboard = !$scope.showDashboard;
        $scope.freezingClick = true;
        $timeout(function(){
            $scope.freezingClick = false;
        },500);
    };

    $scope.switchLoginboard = function(event){
        $scope.showLoginboard = !$scope.showLoginboard;
        $scope.freezingClick = true;
        $timeout(function(){
            $scope.freezingClick = false;
        },500);
    };

    $scope.logout = function(){
        loginManager.requestLogout();
        $scope.loggingOut = true;
        $scope.showDashboard = false;
    };

    $scope.$on('logoutFinished',function(event,data){
        $scope.loggingOut = false;
        if(data.success)
            window.location.reload();
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('clicked',function(event,data) {
        if(!data.event.target)
            return;
        if(!data.event.target.className.indexOf)
            return;
        if (data.event.target.className.indexOf('dashboard') == -1 && !$scope.freezingClick && $scope.showDashboard)
        {
            $scope.showDashboard = false;
            $scope.$apply();
        }
    });

    $scope.countryStatement = function(){
        let element = document.getElementById("countryStatement");
        let statement = $rootScope.countryState;
        let index = 2;
        switch($rootScope.countryCode){
            case 'CN':
                index = 1;
        }
        statement = statement.replace(/%s/g,$rootScope.countryList[index]);
        statement = statement.replace(/%l/g,"<a href='/countryStatement'>"+$rootScope.statementTitle+"</a>");

        if(element)
            element.innerHTML =  statement;
    };


    $scope.initialize = function(){
        if($scope._initialized)
            return;
        $scope._initialized = true;
        $scope.countryStatement();
    };

    $scope.$on('settings finish',function(event,data){
        $scope.initialize();
    })
});