app.filter('lockType', function() { //可以注入依赖
    return function(lockType) {
        switch(lockType)
        {
            case 0:
                return '全网可见';
            case 1:
                return '仅站内可见';
            case 2:
                return '仅自己可见';
        }
    }
});

app.directive('iconBackground',function(){
   return {
      restrict: 'AC',
      scope:{
          selected: '=',
          pointer: '@'
      },
      link:function(scope,element){
         let children = element.children();
         let svg = children[0];

         let getCurrentSelected = function(){
             let index = Number(scope.pointer);
             let str = scope.selected.toString(2);
             while(str.length <7)
             {
                 str = '0'+str;
             }
             return str[index]==='1';
         };

         let switchCurrentSelected = function(){
             let str = scope.selected.toString(2);
             let index = Number(scope.pointer);
             while(str.length <7)
             {
                 str = '0'+str;
             }
             let newResult = str[index]==='0'? '1':'0';
             let firstHalf = '';
             for(let i=0;i<index;++i){
                 firstHalf += str[i];
             }
             str = firstHalf + newResult + str.substring(index+1);
             scope.selected = parseInt(str,2);
         };

         let updateIcon = function(){
             if(getCurrentSelected())
             {
                 svg.style.setProperty('fill','white');
                 element.css('background','rgba(181,163,160,218)');
             }
             else{
                 svg.style.setProperty('fill','rgba(108,95,93,1)');
                 element.css('background', 'rgba(108,95,93,0)');
             }
         };

         updateIcon();

         element
             .on('mouseenter',function(){
                svg.style.setProperty('fill','white');
                element.css('background','rgba(181,163,160,218)');
             })
             .on('mouseleave',function(){
                if(getCurrentSelected())
                   return;
                svg.style.setProperty('fill','rgba(108,95,93,255)');
                element.css('background', 'rgba(108,95,93,0)');
             })
             .on('click',function(){
                 switchCurrentSelected();
                 scope.$apply();
                 updateIcon();
             });
      }
   }
});

app.directive('infoReceiver',function(){
    return {
        restrict: 'E',
        link:function(scope){
            scope.warningTemplate = JSON.parse(unescape(scope.warningTemplate));
            scope.gradeTemplate = JSON.parse(unescape(scope.gradeTemplate));
            scope.workIndex = JSON.parse(unescape(scope.workIndex));
            scope.bookInfo = JSON.parse(unescape(scope.bookInfo));
            scope.bookInfoDetail = JSON.parse(unescape(scope.bookInfoDetail));
            scope.currentIndex = JSON.parse(unescape(scope.currentIndex));
            scope.userSettings = JSON.parse(unescape(scope.userSettings));
            scope.ifSingle = !scope.bookInfo || (scope.bookInfo.status === 0 && scope.bookInfo.chapterCount <= 1);
            scope.bookInfo.status = scope.bookInfo.status.toString();
            scope.maxChapterOrder = scope.bookInfo.chapterCount;
            if(!scope.bookInfoDetail)
                scope.initializeBookDetail();
            if(scope.userSettings)
                scope.fanficEdit = scope.userSettings.fanficEdit;
            scope.initialize();
        }
    }
});

app.directive('selectGroup',function(){
    return{
        restrict:'C',
        scope:{},
        link:function(scope,element){
            element.css('color','rgba(108,95,93,1)');
            element.css('transition','color 0.15s');

            element.on('mouseenter',function(){
                element.css('color','rgba(181,163,160,1)');
                let children = element.children();
                if(children[1])
                   children[1].style.color  = 'rgba(181,163,160,1)';
            })
                .on('mouseleave',function(){
                    element.css('color','rgba(108,95,93,1)');
                    let children = element.children();
                    if(children[1])
                        children[1].style.color  = 'rgba(108,95,93,1)';
                })
        }
    }
})

app.directive('chapterSelect',function(){
    return {
        restrict: 'C',
        link:function(scope,element){
            scope.selected = false;

            scope.$on('chapterTitle changed',function(event,data){
                if(scope.list._id === data.id)
                    scope.list.chapter.title = data.title;
            });

            scope.$on('chapter selected',function(){
                if(scope.$parent.
                selectedChapters.indexOf(scope.list.order) === -1)
                {
                    scope.selected = false;
                    element.css('background','rgba(0,0,0,0)');
                    element.css('color',color);
                }
                else{
                    scope.selected = true;
                    element.css('background','rgba(51,153,255,255)');
                    element.css('color','white');
                }
            });

            scope.$on('clicked',function(event,data){
                if(data.event.target !== element[0] && !window.event.ctrlKey && !window.event.shiftKey)
                {
                    scope.selected = false;
                    element.css('background','rgba(0,0,0,0)');
                    element.css('color',color);
                    let index = scope.$parent.selectedChapters.indexOf(scope.list.order);
                    scope.$parent.selectedChapters.splice(index,1);
                    scope.$parent.$apply();
                }
            });

            disableSelect(element);
            let color = element.css('color');
            if(!scope.list.chapter || !scope.list.chapter.published)
            {
                color = 'dimgray';
                element.css('color',color);
                element.css('font-style','italic');
            }

            if(scope.list && scope.$parent.currentIndex){
                if(scope.list.order === scope.$parent.currentIndex.order)
                    element.css('font-weight','bold');
                else
                    element.css('font-weight','normal');
            };


            scope.$on('fanfic loaded',function(){
                if(scope.list.order === scope.$parent.currentIndex.order)
                    element.css('font-weight','bold');
                else
                    element.css('font-weight','normal');
            });

            element
                .on('mouseenter',function(){
                    if(scope.selected)
                        return;
                    element.css('background','rgba(51,153,255,255)');
                    element.css('color','white');
                })
                .on('mouseleave',function(){
                    if(scope.selected)
                        return;
                    element.css('background','rgba(0,0,0,0)');
                    element.css('color',color);
                })
                .on('click',function(event){
                    if(scope.selected)
                        return;
                    event.stopPropagation();
                    if(!window.event.ctrlKey && !window.event.shiftKey)
                    {
                        scope.$parent.selectedChapters.length = 0;
                    }
                    if(window.event.shiftKey){
                        if(!scope.$parent.selectedChapter)
                            return;
                        let currentOrder = -1;
                        let targetOrder = -1;
                        for(let i=0; i< scope.$parent.workIndex.length;++i){
                            if(scope.$parent.workIndex[i].order === scope.list.order)
                                currentOrder = i;
                            else if (scope.$parent.workIndex[i].order === scope.$parent.selectedChapter.order)
                                targetOrder = i;
                        }
                        if(currentOrder < 0 || targetOrder<0 || currentOrder === targetOrder)
                            return;
                        scope.$parent.selectedChapters = [scope.list.order];
                        let step = currentOrder >= targetOrder ? 1 : -1;
                        while(targetOrder !==currentOrder){
                            scope.$parent.selectedChapters.push(scope.$parent.workIndex[targetOrder]._id);
                            targetOrder += step;
                        }
                    }
                    else{
                        scope.$parent.selectedChapters.push(scope.list.order);
                        if(!window.event.ctrlKey)
                              scope.$parent.selectedChapter = scope.list;
                    }
                    scope.$parent.$apply();
                    scope.$parent.$broadcast('chapter selected',{});
                })
                .on('dblclick',function() {
                    if (scope.$parent.contentsLoaded){
                        let savFile = {
                            chapter:scope.$parent.chapter,
                            workInfo:scope.$parent.workInfo,
                            credential:scope.$parent.credential
                        }
                        if(window.localStorage)
                        {
                            localStorage.setItem('fanfic_contents'+scope.$parent.chapter.order,LZString.compressToBase64(JSON.stringify(savFile)));
                        }else if(scope.fanficSav){
                            scope.fanficSav['fanfic_contents'+scope.$parent.chapter.order] = LZString.compressToBase64(JSON.stringify(savFile));
                        }

                        scope.$parent.currentIndex = scope.list;
                        if(window.localStorage && window.localStorage.getItem('fanfic_contents'+scope.list.order))
                            scope.$emit('fanficReceived',{success:true,file:JSON.parse(LZString.decompressFromBase64(window.localStorage.getItem('fanfic_contents'+scope.list.order)))});
                        else if(scope.fanficSav['fanfic_contents'+scope.list.order]){
                            scope.$emit('fanficReceived',{success:true,file:JSON.parse(LZString.decompressFromBase64(scope.fanficSav.getItem('fanfic_contents'+scope.list.order)))});
                        }else
                            scope.$parent.loadContent();
                    }
                });
        }
    }
});

app.directive('tagCollector',function(){
    return {
       restrict: 'EA',
       scope:{
           list:'=',
           hint:'@'
       },
       template:'<div class="myInput displayRow" style="position:relative;flex-wrap:wrap;padding:0;margin-bottom:0;font-family:SimSun-ExtB,Arial,serif;">\n' +
           '<div class="inputHint" ng-show="showHint" style="margin-left:40px;">{{hint}}</div>\n' +
           '<div><svg class="icon icon-users" style="width:22px;height:30px;" ><use xlink:href="#icon-price-tags"></use></svg></div>\n' +
           '<div class="remove-line no-select" ng-repeat="item in list" ng-click="removeTag($index)" style="font-size:14px;height:1.9rem;margin-left:10px;line-height:1.9rem;color:rgba(133,109,105,255);">#{{item}}</div>\n' +
           '<div style="height:1.9rem;flex:1;margin-left:5px;padding:0;min-width:2rem;"><input maxlength="30" style="color:rgba(70,59,57,255);"></div>\n' +
           '</div>',
        link:function(scope,element){
           let root = element.find('input');
           let refresh = function(){
               scope.showHint = root[0].value === ''&& scope.list.length === 0;
               scope.$apply();
           };
           let addList = function(){
                let value = root[0].value;
                root[0].value = '';
                value.replace(/#/g,'');
                value.replace(/，/g,',');
                let input = value.split(',');
                for(let i =0;i<input.length;++i)
                {
                    if(input[i]!== '' && scope.list.indexOf(input[i]) === -1)
                    {
                        scope.list.push(input[i]);
                    }
                }
                refresh();
           };

           let removeList = function(){
               if(root[0].value==='')
                   scope.list.pop();
               refresh();
           };

           scope.removeTag = function(index)
           {
               scope.list.splice(index,1);
               scope.showHint = root[0].value === ''&& scope.list.length === 0;
           };

           scope.initialize = function(){
               scope.showHint = root[0].value === ''&& scope.list.length === 0;
           }

           scope.$on('inputHintIni',function(){
               scope.showHint = root[0].value === ''&& scope.list.length === 0;
           });

           root.on('input',function(){
               refresh();
           })
               .on('keydown',function(event){
                   if(event.keyCode === 13)
                       addList();
                   else if(event.keyCode === 8)
                       removeList();
               });

           scope.initialize();
        }
    }
});

app.controller("TinyMceController",['$scope','$rootScope','$cookies','$location',function($scope,$rootScope,$cookies,$location){
    $scope.tinymceModel = '';

    $scope.tinymceOptions = {
        height:"100%",
        menubar: false,
        width:"100%",
        resize:false,
        statusbar:false,
        paste_as_text: true,
        skin:"archive_cleegame",
        content_css:"archive",
        plugins: 'paste link image lists code',
        toolbar: 'fontsizeselect forecolor backcolor | bold italic strikethrough underline | alignleft aligncenter alignright | bullist numlist | link image | code',
        image_dimensions: false,
        image_description:false,
    };

    $scope.$on('enable editor',function(event,data){
        if(data.editor_id === $scope.editor_id){
            $scope.toggleEditor(data.enable);
        }
    })

    $scope.$on('reset current',function(event,data){
        try{
            $scope.tinymceModel = "";
            data.callback(data.variables);
        }catch(err){
            console.log(err);
        }
    })

    $scope.$watch('tinymceModel',function(after,before){
        try{
            $scope.getPlainText();
            if(!$scope.tinymceText)
                return;
            let text = $scope.tinymceText.replace(/\s+/g,"");
            let wordCount = text.length;
            $scope.$parent.changeWordCount(wordCount);
        }catch(err){
            console.log(err);
        }
    })

}]);


app.controller("editCon",function($scope,$http,$rootScope,$interval,$timeout,$window,$location,fanficManager,userManager){
    $scope.fanficSav = {};
    $scope.db = null;
    $scope.dbLoaded = false;

    $scope.error = '';
    $scope.acceptableError = [];

    $scope.contentsLoaded = false;

    $scope.bookSaving = false;
    $scope.chapterSaving = false;
    $scope.indexEditing = false;

   //界面属性用变量
    $scope.userSettings = null;
    $scope.fanficEdit = 113;
    $scope.setSeving = false;
    $scope.useCode = false;
    $scope.submitType = 2;
    $scope.readyType = 0;
    $scope.publishing = false;

   //当前编辑章节用变量
   $scope.tagInput = '';
   $scope.warningInput = '';
   $scope.fandomInput = '';
   $scope.introInput = '';
   $scope.currentWarningSelect='';
   $scope.selectedChapters = [];


    $scope.autoBookSave = $interval(function(){
        $scope.saveBook();
    },15*60*1000);

    $scope.autoSettingSave = $interval(function(){
        $scope.saveSettings();
    },30*1000);


   $scope.loadAutoSave = function(){
       let order = $scope.chapter? $scope.chapter.order : $scope.currentIndex.chapterOrder;
       if(window.localStorage)
       {
           return localStorage.getItem('fanfic_contents'+order);
       }else if($scope.fanficSav['fanfic_contents'+order]){
            return $scope.fanficSav['fanfic_contents'+order];
       }else
           return null;
   }

   $scope.saveSettings = function(){
       if($scope.settingSaving || $scope.fanficEdit === $scope.userSettings.fanficEdit)
           return;
       $scope.settingSaving = true;
       userManager.saveSettings({fanficEdit:$scope.fanficEdit});
   }

    $scope.saveBook = function(){
       if($scope.autoSaving || !$scope.contentsLoaded)
           return;
       $scope.autoSaving = true;
        let savFile = {
            chapter:$scope.chapter,
            workInfo:$scope.workInfo,
            credential:$scope.credential
        }
        if(window.localStorage)
        {
            localStorage.setItem('fanfic_contents'+$scope.chapter.order,LZString.compressToBase64(JSON.stringify(savFile)));
        }else if(scope.fanficSav){
            scope.fanficSav['fanfic_contents'+scope.$parent.currentIndex.order] = LZString.compressToBase64(JSON.stringify(savFile));
        }
        $scope.autoSaving = false;
    };

   $scope.loadContent = function(){
       if($scope.loadAutoSave()) {
           $scope.contentsLoaded = true;
           $scope.requestingFanfic = false;
           $rootScope.$broadcast('fanficReceived', {
               success: true,
               file: JSON.parse(LZString.decompressFromBase64($scope.loadAutoSave()))
           })
       }else if($scope.currentIndex._id){
           $scope.contentsLoaded = false;
           $scope.requestingFanfic = true;
           fanficManager.requestFanfic($scope.currentIndex);
       }else {
           $scope.contentsLoaded = true;
           $scope.requestingFanfic = false;
           $scope.initializeChapter();
           $scope.$broadcast('inputHintIni');
           $scope.$broadcast('fanfic loaded');
       }
   };

    $scope.initializeBookDetail = function(){
        $scope.bookInfoDetail = {};
        $scope.bookInfoDetail.intro = '';
        $scope.bookInfoDetail.tag = [];
        $scope.bookInfoDetail.fandom = [];
        $scope.bookInfoDetail.relationships = [];
        $scope.bookInfoDetail.characters = [];
        $scope.bookInfoDetail.warning = [];
        $scope.bookInfoDetail.grade = 0;
    };

   $scope.initializeChapter = function(){
       //当前界面章节变量
       $scope.chapter = {};
       $scope.credential = {};
       $scope.workInfo  = {};
       $scope.chapter._id = null;
       $scope.chapter.title = '';
       $scope.chapter.order = 0;
       $scope.chapter.notes = "";
       $scope.workInfo.fandom = [];
       $scope.workInfo.relationships = [];
       $scope.workInfo.characters = [];
       $scope.workInfo.tag = [];
       $scope.workInfo.intro = '';
       $scope.workInfo.grade = $scope.gradeTemplate[0];
       $scope.workInfo.warning = [];
       $scope.credential.lockType = 0;
       $scope.credential.passcode = {use:false,code:''};
   };

   let refreshBookInfoDetail = function(){
       $scope.bookInfoDetail.intro = $scope.workInfo.intro;
       $scope.bookInfoDetail.grade = $scope.workInfo.grade.code;
       $scope.bookInfoDetail.fandom = $scope.workInfo.fandom;
       $scope.bookInfoDetail.relationships = $scope.workInfo.relationships;
       $scope.bookInfoDetail.characters = $scope.workInfo.characters;
       $scope.bookInfoDetail.tag = $scope.workInfo.tag;
       $scope.bookInfoDetail.warning = $scope.workInfo.warning;
   };

   //取值型共嗯
    $scope.valueAtBit = function(num,bit){
        return (num >> bit) &1;
    };

    //设值型功能
    $scope.removeError = function(){
        $scope.error = '';
    };

    $scope.changeWordCount = function(wordCount){
        let wordCountAll = 0;
        if($scope.resetting || $scope.publishing)
            return;
        $scope.workInfo.wordCount = wordCount;
        for(let i=0; i<$scope.workIndex.length;++i){
            if($scope.workIndex[i].order != $scope.chapter.order)
                wordCountAll += $scope.workIndex[i].wordCount;
        }
        wordCountAll += $scope.workInfo.wordCount;
        $scope.bookInfo.wordCount = wordCountAll;
    };

    $scope.removeIndex = function(item){
        try{
            for(let i =0; i< $scope.workIndex.length;++i){
                if($scope.workIndex[i].order === item.order)
                {
                    if(item.chapterOrder === $scope.chapter.order){
                        $scope.contentsLoaded = false;
                        let newIndex = i-1;
                        if(newIndex <0)
                            newIndex = 0;
                        $scope.currentIndex = $scope.workIndex[newIndex]
                        $scope.loadContent();
                    }
                    $scope.workIndex.splice(i,1);
                    break;
                }
            }
        }catch(err){

        }
    };

    $scope.updateIndex = function(item){
        try{
            for(let i =0; i< $scope.workIndex.length;++i){
                if($scope.workIndex[i]._id === item._id)
                    $scope.workIndex[i] = JSON.parse(JSON.stringify($scope.workIndex[i]));
            }
        }catch(err){

        }
    };


    //===================================================================================================================
    //===                                  按钮方法                                                              ======
    //===================================================================================================================


    //警告操作
    $scope.addWarningTemplate = function(){
        if($scope.currentWarningSelect === '')
            return;
        if($scope.chapter.warning.indexOf($scope.currentWarningSelect) === -1)
            $scope.chapter.warning.push($scope.currentWarningSelect);

    };

    $scope.removeWarning = function(list){
        if($scope.chapter.warning.indexOf(list) !== -1)
        {
            let pos = $scope.chapter.warning.indexOf(list);
            $scope.chapter.warning.splice(pos,1);
        }
    };

    $scope.submitWarning = function($event){
        if($event.keyCode !== 13)
            return;
        if($scope.chapter.warning.length>=10)
        {
            $scope.error = '最多只能输入10条警告！';
            $timeout($scope.removeError,10);
            return;
        }
        if($scope.chapter.warning.indexOf($scope.warningInput) === -1)
        {
            $scope.chapter.warning.push($scope.warningInput);
            $scope.warningInput = '';
        }
    };

    $scope.addChapter = function(){
        if($scope.indexEditing)
            return;
        if($scope.selectedChapters>1)
            return;
        $scope.indexEditing = true;
        $rootScope._buttonClicked = true;
        let data = {
            prev:null,
            next:null,
            prevIndex: -1,
            nextIndex: -1,
            currentOrder:-1,
            work:$scope.bookInfo._id,
            prevId:null
        };
        if($scope.selectedChapters.length >0)
            data.prevId = $scope.selectedChapters[$scope.selectedChapters.length-1];
        else
            data.prevId = $scope.workIndex[$scope.workIndex.length-1]._id;
        $scope.workIndex.map(function(item,i){
            if(item._id === data.prevId)
            {
                data.prevIndex = i;
                data.currentOrder = item.order;
            }
            if(data.prevIndex>=0 && (i-data.prevIndex) === 1)
                data.nextIndex = i;
        });

        if(data.prevIndex>=0)
            data.prev = $scope.workIndex[data.prevIndex]._id;
        if(data.nextIndex>=0)
            data.next = $scope.workIndex[data.nextIndex]._id;

        fanficManager.addChapter(data);
    };

    $scope.removeChapter = function(){
        $rootScope._buttonClicked = true;
        $scope.indexEditing = true;
        let data ={list:[],chapterCount:$scope.bookInfo.chapterCount,bookId:$scope.bookInfo._id};
        if($scope.selectedChapters.length === $scope.workIndex.length)
        {
            $scope.$emit('showError','您不能删除全部章节');
            return;
        }
        for(let i=0; i< $scope.workIndex.length;++i)
        {
            let item = $scope.workIndex[i];
            item.deleted = $scope.selectedChapters.indexOf(item._id) !== -1;
            data.list.push(item);
        }
        fanficManager.removeChapter(data);
    };

    $scope.chapterSwap = function(step){
        $rootScope._buttonClicked = true;
        let currentIndex = -1;
        for(let i=0; i<$scope.workIndex.length;++i){
            if($scope.workIndex[i]._id === $scope.selectedChapter._id)
                currentIndex = i;
        }
        if(currentIndex >0){
            if(currentIndex+step >= $scope.workIndex.length)
                $scope.$emit("showError",'已为最后一位，无法调换');
            else if(currentIndex+step <0)
                $scope.$emit("showError",'已为首位，无法调换');
            else{
                let data = {
                    current: $scope.workIndex[currentIndex]._id,
                    target: $scope.workIndex[currentIndex+step]._id
                };
                fanficManager.swapChapter(data);
            }

        }
    };

    let saveDraft = function(){
        if(!$scope.chapterSaving && !$scope.chapter.published) {
            fanficManager.saveFanfic($scope.chapter);
            $scope.chapterSaving = true;
        }
        if(!$scope.bookSaving && !$scope.bookInfo.published) {
            fanficManager.saveBook($scope.bookInfo);
            $scope.bookSaving = true;
        }
    };

    let checked = function(){
        if($scope.bookInfo.title === '')
        {
            $scope.$emit('showError','文章标题不能为空');
            return false;
        }
        return true;
    };

    let publish = function(){
        if(!checked())
            return;
        else if($scope.workInfo.wordCount < 30)
            return;
        if($scope.publishing)
            return;
        $scope.publishing = true;
        fanficManager.publish($scope.bookInfo,$scope.chapter,$scope.workIndex,$scope.ifSingle);
    };

    let publishAll = function(){
        if(!checked())
            return;
        else if($scope.bookInfo.wordCount <= 200){
            $scope.$emit('showError','不得发布总字数少于200的文章');
            return;
        }
        $scope.$emit('showError','该功能尚在开发中，敬请等待');
    }


    $scope.resetContents = function(data){
        $scope.resetting = false;
        $scope.initializeChapter();
        $scope.chapter._id = data._id;
        $scope.chapter.order = data.order;
        $scope.$broadcast('enable editor', {enable:true,editor_id:'fanfic_editor'});
    }

;

    $scope.resetCurrent = function(){
        if($scope.resetting)
            return;
        $scope.resetting = true;
        let alertMessage= $scope['message_reset_current'];
        if(alertMessage)
            alertMessage = unescape(alertMessage);
        let alertInfo = {alertInfo:alertMessage};
        $scope.$broadcast('enable editor', {enable:false,editor_id:'fanfic_editor'});
        alertInfo.variables = {info:'resetting current',_id:$scope.chapter._id,order:$scope.chapter.order};
        $scope.$emit('showAlert', alertInfo);
    };

    $scope.preview = function(){
        let data = {currentIndex:{_id:$scope.chapter._id,order:$scope.chapter.order},
            book:$scope.bookInfo,
            chapter:$scope.chapter,
            workInfo:$scope.workInfo,
            credential:$scope.credential,
            index:$scope.workIndex};
        fanficManager.preview(data);
    };

    $scope.submit = function(){
        switch($scope.submitType)
        {
            case 0:
                publish();
                break;
            case 1:
                saveDraft();
                break;
            case 2:
                publishAll();
                break;
        }
    };


    $scope.$on('fanficReceived',function(event,data){
        $scope.requestingFanfic = false;
        if(data.success)
        {
            let info = data.file || data.chapter;
            $scope.chapter = info.chapter;
            $scope.chapter.contents = LZString.decompressFromBase64($scope.chapter.contents);
            $scope.credential = info.credential;
            $scope.workInfo = info.workInfo;
            for(let i=0;i <$scope.gradeTemplate.length;++i){
                if($scope.workInfo.grade.code === $scope.gradeTemplate[i].code)
                    $scope.workInfo.grade = $scope.gradeTemplate[i];
            }
            for(let i=0; i<$scope.workIndex.length;++i){
                if($scope.workIndex[i].order === info.chapter.order)
                    $scope.currentIndex = $scope.workIndex[i];
            }
            $scope.workIndex.map(function(item,i){
                if(item.order === info.chapter.order){
                    $scope.workIndex[i].title = $scope.chapter.title;
                    $scope.workIndex[i].chapter = $scope.chapter._id;
                }
            });
            $scope.contentsLoaded = true;
            if($scope.chapter.order === $scope.workIndex[0].chapterOrder)
                refreshBookInfoDetail();

            $timeout(function(){$scope.$broadcast('inputHintIni')},10);
            $scope.$broadcast('fanfic loaded',{});
        }
        else{
            $scope.contentsLoaded = true;
            $scope.$emit("showError",data.message);
        }
    });

    $scope.$on('chapterSaved',function(event,data){
        $scope.chapterSaving = false;
        if(data.success)
        {
            $scope.chapter = JSON.parse(JSON.stringify(data.chapter));
            $timeout(function(){$scope.$broadcast('inputHintIni')},10);
            $scope.workIndex.map(function(item){
                if(item._id === data.chapter._id)
                {
                    item.chapter.title = data.chapter.chapter.title;
                    item.chapter.wordCount = data.chapter.chapter.wordCount;
                }
            });
            if(data.chapter.order === $scope.workIndex[0].chapterOrder)
               refreshBookInfoDetail();
        }
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('publish finished',function(event,data){
        $scope.publishing = false;
        let rootUrl = 'http://'+$location.host();
        if(window.localStorage)
            window.localStorage.clear();
        if(data.success)
            $window.location.href = rootUrl+'/fanfic/'+data._id;
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('bookSaved',function(event,data){
        $scope.bookSaving = false;
        if(data.success)
        {
            $scope.bookInfo = JSON.parse(JSON.stringify(data.book));
            if($scope.bookInfo.hasOwnProperty('status'))
               $scope.bookInfo.status = $scope.bookInfo.status.toString();
        }
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('chapterAdded',function(event,data){
        $scope.indexEditing = false;
        $scope.contentsLoaded = true;
        if(data.success)
        {
           $scope.workIndex.splice(data.insertId+1,0,data.newIndex);
           for(let i = data.inserId+2;i<$scope.workIndex.length;++i)
               $scope.workIndex[i].order++;
           $scope.bookInfo.chapterCount++;
        }
        else
            $scope.$emit('showError',data.message);
    });


    $scope.$on('chapterRemoved',function(event,data){
        $scope.indexEditing = false;
        $scope.contentsLoaded = true;
        if(data.success)
        {
            for(let i =0; i< data.deleted.length;++i)
                $scope.removeIndex(data.deleted[i]);
            for(let i =0; i<data.updated.length;++i)
                $scope.updateIndex(data.updated[i]);
            $scope.bookInfo.chapterCount = data.chapterCount;
        }
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$on('chapterSwapped',function(event,data){
        $scope.indexEditing = false;
        $scope.contentsLoaded = true;
        if(data.success)
        {
            for(let i =0 ;i<$scope.workIndex.length;++i){
                if($scope.workIndex[i]._id == data.current._id)
                    $scope.workIndex[i].chapter = JSON.parse(JSON.stringify(data.current.chapter));
                else if($scope.workIndex[i]._id == data.target._id)
                    $scope.workIndex[i].chapter = JSON.parse(JSON.stringify(data.target.chapter));
            };
            if($scope.currentIndex._id === data.current._id)
                $scope.currentIndex.chapter = data.current.chapter._id;
            else if ($scope.currentIndex._id === data.target._id)
                $scope.currentIndex.chapter = data.target.chapter._id;
        }
        else
            $scope.$emit('showError',data.message);
    });


    $scope.$on('preview ready',function(event,data){
           if(data.success)
               window.open("/fanfic/post/preview",'_blank');
           else
               $scope.$emit('showError',data.message);
    });

    $scope.$on('settingsSaveFinished',function(event,data){
        $scope.settingSaving = false;
        if(data.success)
           $scope.userSettings = data.info;
        else
            $scope.$emit('showError',data.message);
    });

    $scope.$watch('chapter.title',function(){
        $scope.$broadcast('chapterTitle changed',{id:$scope.currentIndex? $scope.currentIndex._id: null,title:$scope.chapter.title});
    });

    $scope.$watch('chapter',function(){
        for(let i=0;i<$scope.workIndex.length;++i){
            if($scope.workIndex[i].order === $scope.chapter.order)
                $scope.workIndex.uploaded = false;
        }
    },true)

    $scope.$watch('workInfo',function(){
        for(let i=0;i<$scope.workIndex.length;++i){
            if($scope.workIndex[i].order === $scope.chapter.order)
                $scope.workIndex.uploaded = false;
        }
        if($scope.workIndex[0].chapterOrder === $scope.chapter.order){
            refreshBookInfoDetail();
        }
    },true)


    $scope.$on('tellYes',function(event,data){
        if(data.variables['info'] === 'resetting current'){
            $scope.$broadcast('reset current',{callback:$scope.resetContents,variables:data.variables});
        }
    });

    $scope.$on('tellNo',function(event,data){
        if(data.variables['info'] === 'resetting current'){
            $scope.resetting = false;
            $scope.$broadcast('enable editor', {enable:true,editor_id:'fanfic_editor'});
        }
    });


    $scope.initialize = function(){
        $scope.loadContent();
    };
});


