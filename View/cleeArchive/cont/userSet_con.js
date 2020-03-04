app.controller("userSetCon",['$scope','$rootScope','$timeout','userManager',function($scope,$rootScope,$timeout,userManager){
    $scope.requesting = false;
    $scope.badges = [
        {name:'文章创作者',order:1,description:'拥有该权限的你可以在社区中发布小说、文章等任何文字作品。'},
        {name:'艺术工作者',order:2,description:'拥有该权限的你可以在社区中发布处理后照片、手绘、数码绘等任何艺术创作作品'},
        {name:'游戏设计师',order:3,description:'拥有该权限的你可以在社区中发布您已经创作的同人游戏信息'},
        {name:'技术工作者',order:4,description:'拥有该权限的你可以在社区中发表技术文章，并以技术支持者的身份参与到游戏的开发中去'},
        {name:'音乐创作者',order:5,description:'拥有该权限的你可以在社区中发表您所创作的同人或原创音乐'}];
    $scope.application = $scope.badges[0];
    $scope.enabled = [1];
    $scope.enabledSubmit = false;
    $scope.badgeImage = null;
    $scope.preferenceUploading = false;
    $scope.mailEditing = false;
    $scope.splitStr = function(str){
        let list = [];
        for(let i=0;i<str.length;++i){
            list.push(str[i]);
        }
        return list;
    };

    $scope.initializePreference = function(){
        $rootScope.preference = $rootScope.preference.toString(2);
        while($rootScope.preference.length < 5){
            $rootScope.preference = '0'+$rootScope.preference;
        }
        $rootScope.preference = $scope.splitStr($rootScope.preference);
    };

    $scope.$watch('application',function(){
        if(!$scope.initialized)
            return;
        $scope.refreshApplicationBtn()
    });


    $scope.$watch('preference',function(err,doc){
        if(!$scope.initialized )
            return;
        if($scope.preferenceUploading)
            return;
        $scope.preferenceUploading = true;
        let preference = parseInt($rootScope.preference.join(''),2);
        userManager.savePreference({preference:preference});
    },true);

    $scope.$on('basicInfoSaveFinished',function(event,data){
        if(data.type === 'intro')
            $scope.introRequesting = false;
        else if(data.type === 'mail')
            $scope.mailRequesting = false;
        if(data.success){
            if(data.type === 'intro')
                $rootScope.settings.intro = data.intro;
            else if(data.type === 'mail')
                $rootScope.settings.mail = data.mail;
        }
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('preferenceSaveFinished',function(event,data){
        $scope.preferenceUploading = false;
        if(data.success)
        {
            let preference = data.result.toString(2);
            while(preference.length<5){
                preference = '0'+preference;
            }
            $rootScope.preference = preference;

        }
        else{
            $scope.$emit('showError',data.message);
        }
    });

    $scope.$on('requestSettingFinished',function(event,data){
        $scope.requestSetting = false;
        if(data.success)
        {
            $rootScope.userAccess = data.result.access;
            let element  = document.getElementById('badgeRow');
            $scope.initBadge(element);
            $scope.refreshApplicationBtn();
        }
        else{
            $scope.$emit('showError',data.message);
        }
    })

    $scope.refreshApplicationBtn = function(){
        if($scope.enabled.indexOf($scope.application.order) < 0)
            $scope.application.error = '该功能尚未开发完成，敬请期待';
        else if($rootScope.userAccess.indexOf(100+$scope.application.order) >=0)
            $scope.application.error = '您已经拥有该项权限，无法继续申请';
        else if($rootScope.userAccess.indexOf($scope.application.order)>=0)
            $scope.application.error = '您已经提交了该权限的申请，请勿重复提交';
        else
            $scope.application.error = '';
        $scope.enabledSubmit = $scope.application.error === '';
        let element = document.getElementById('submitButton');
        if(element)
            element.disabled = $scope.enabledSubmit? null : true;
    };

    $scope.message = [
        '<p>因为网站资金原因，因此暂不开放图片资源类的自主上传与修改，但开发者正在考虑以后为大家提供一些网站的默认头像，所以提供了头像位。</p>'+
        '<p>如果您对解决该问题有任何建议，欢迎提交您的个人意见，我们会认真考虑。</p>'+
        '<p style="padding-left:2rem;">如果您是会员，可以在提交建议页面提交您的宝贵意见 <a href="/suggestion" target="_blank">+click+</a></p>'+
        '<p style="padding-left:2rem;">如果您不是会员，可以选择给网站的公共邮箱发送邮件：<a href="mailto:cleegame@outlook.com">+click</a></p>'+
        '<p>我和管理员会尽量做到认真阅读每一个建议，祝大家玩得愉快。</p>'
    ];

    $scope.showExplain = function(index){
          $scope.$emit('showExplain',$scope.message[index]);
    };

    $scope.getBadgeUrl = function(){
        let blob = new Blob([$scope.badgeImage]);
        return window.URL.createObjectURL(blob);
    };

    $scope.initBadge = function(element){
        if(!element)
            return;
        if($rootScope.userAccess.length === 0)
            element.innerHTML = '您暂无任何创作者权限，欢迎提交申请';
        else{
            let innerHTML = '';
            for(let i=0;i <$rootScope.userAccess.length;++i){
                let index = $rootScope.userAccess[i];
                if(index >100)
                     innerHTML += '<div style="background-image:url('+$scope.getBadgeUrl()+');background-position-x:'+70*(index-101)+'px;"></div>';
                else
                    innerHTML +=  '<div style="position:relative" ><div style="min-width:100%;min-height:100%;filter:grayscale(1);background-image:url('+$scope.getBadgeUrl()+');background-position-x:'+70*(index-1)+'px;"></div>'+
                        '<div style="position:absolute;width:100%;height:100%;left:0;top:0;display:flex;font-weight:bold;"><span style="margin:auto;">申请中</span></div></div>';
            }
            element.innerHTML = innerHTML;
        }
    };

    $scope.requestFile = function() {
        let requestFile = new XMLHttpRequest();
        requestFile.open("GET", '/img/badges.png');
        requestFile.responseType = "arraybuffer";
        requestFile.send();
        requestFile.onload = function () {
            if (requestFile.status < 400) {
                let accessApplicator = document.getElementById('accessSelect');
                if(accessApplicator)
                    accessApplicator.disabled=  null;
                $scope.refreshApplicationBtn();
                $scope.badgeImage = requestFile.response;
                let element  = document.getElementById('badgeRow');
                $scope.initBadge(element);
            }
        };
    };

    $scope.reloadAccess = function(){
        if($scope.requestSetting)
            return;
        $scope.requestSetting = true;
        userManager.reloadSettings(null);
    };

    $scope.accessApply = function(){
        let formatStr = '如果您需要作为<b>'+$scope.application.name+'</b>发布您的创作，请填写以下内容并点击确定按钮完成申请';
        let application = document.getElementById('AccessApplicationState');
        if(application)
            application.innerHTML = formatStr;
        let board = document.getElementById('userAccessApplication');
        if(board)
            board.style.height = '22rem';
    };

    $scope.applyConfirm = function(condition){
        let board = document.getElementById('userAccessApplication');
        let children = board.children;
        if(!board)
            return;
        if(children.length <3)
            return;
         if(condition) {
             let error = null;
             if(children[1].value.length <= 15)
                 error = '申请陈述不能少于15个字';
             if(error!=null){
                 $scope.$emit('showError',error);
                 return;
             }
             $rootScope.userAccess.push($scope.application.order);
             let data = {
                 type:1,
                 statements:children[1].value,
                 subType:$scope.application.order,
             };
             userManager.requestApplication(data);
             $scope.refreshApplicationBtn();
             let element  = document.getElementById('badgeRow');
             $scope.initBadge(element);
             board.style.height = '0';
         }else{
             board.style.height = '0';
         }
    };

    $scope.editMail = function(event){
        if(!$scope.initialized)
            return;
        if($scope.mailRequesting)
            return;
        if($scope.mailEditing){
            if(!$rootScope.settings.mail.match(/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/)){
                $scope.$emit('showError','请输入正确的邮箱格式');
                return;
            }
            $scope.mailRequesting = true;
            let prev = event.target.previousElementSibling;
            if(prev){
                prev.innerHTML = $rootScope.settings.mail;
                if($rootScope.settings.mail.length === 0)
                    prev.innerHTML = '暂无邮箱';
            }
            userManager.saveBasicInfo({mail:$rootScope.settings.mail,type:'mail'});

        }
        $scope.mailEditing = !$scope.mailEditing;
        let element = document.getElementById('mailBoard');
        if(element){
            element.style.opacity = $scope.mailEditing? '1':'0';
            element.style.pointerEvents = $scope.mailEditing?'auto':'none';
            event.target.previousElementSibling.style.opacity =  $scope.mailEditing? '0':'1';
            event.target.innerHTML = $scope.mailEditing? '保存':'编辑';
        }
    };

    $scope.editIntro = function(event){
        if(!$scope.initialized)
            return;
        if($scope.introRequesting)
            return;
        let element = document.getElementById('introBoard');
        if(!element)
            return;
        if($scope.introEditing){
            let prev = element.nextElementSibling;
            if(prev){
                prev.innerHTML = $rootScope.settings.intro;
                if($rootScope.settings.intro.length === 0)
                    prev.innerHTML = '暂无简介';
            }
            $scope.introRequesting = true;
            userManager.saveBasicInfo({intro:$rootScope.settings.intro,type:'intro'});
        }
        $scope.introEditing = !$scope.introEditing;
        element.nextElementSibling.style.opacity =  $scope.introEditing? '0':'1';
        element.style.opacity = $scope.introEditing? '1':'0';
        element.style.pointerEvents = $scope.introEditing?'auto':'none';
        event.target.innerHTML = $scope.introEditing? '保存':'编辑';
    };

    $scope.initialize = function(){
        if($scope.initialized)
            return;
        $scope.requestFile();
        $scope.reloadAccess();
        $scope.initializePreference();
        $scope.initialized = true;
    };

    $scope.initialize();
}]);
