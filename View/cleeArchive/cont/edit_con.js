app.filter('lockType', function() { //可以注入依赖
    return function(lockType) {
        switch(lockType)
        {
            case 0:
                return '全网可见';
                break;
            case 1:
                return '仅站内可见';
                break;
            case 2:
                return '仅自己可见';
                break;
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
      link:function(scope,element,attr){
         let children = element.children();
         let svg = children[0];

         let getCurrentSelected = function(){
             let currentSelected =false;
             let index = Number(scope.pointer);
             let str = scope.selected.toString(2);
             while(str.length <7)
             {
                 str = '0'+str;
             }
             currentSelected = str[index]=='1';
             return currentSelected;
         };

         let switchCurrentSelected = function(){
             let str = scope.selected.toString(2);
             let index = Number(scope.pointer);
             while(str.length <7)
             {
                 str = '0'+str;
             }
             let newResult = str[index]=='0'? '1':'0';
             let firstHalf = '';
             let nextPart = '';
             for(let i=0;i<index;++i){
                 firstHalf += str[i];
             };
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
                 svg.style.setProperty('fill','rgba(108,95,93,255)');
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
        link:function(scope,element,attr){
            scope.bookInfo.status = scope.bookInfo.status.toString();
            if(!scope.bookInfoDetail)
                scope.initializeBookDetail();
            let index = scope.workIndex.map(function(item,i,arr){
                return item._id;
            });
            let i =0;
            while(scope.workIndex[i] && scope.workIndex[i].next)
            {
                let pos = index.indexOf(scope.workIndex[i].next);
                let temp = JSON.stringify(scope.workIndex[pos]);
                if(pos >= 0)
                {
                    scope.workIndex[pos] = JSON.parse(JSON.stringify(scope.workIndex[++i]));
                    scope.workIndex[i] = JSON.parse(temp);
                    temp = index[pos];
                    index[pos] = index[i];
                    index[i] = temp;
                }
                else{
                    ++i;
                    continue;
                }
            }

            if(scope.userSettings)
                scope.fanficEdit = scope.userSettings.fanficEdit;
        }
    }
});

app.directive('chapterSelect',function(){
    return {
        restrict: 'C',
        link:function(scope,element,attr){
            scope.selected = false;

            scope.$on('chapterTitle changed',function(event,data){
                if(scope.list._id == data.id)
                    scope.list.chapter.title = data.title;
            });

            scope.$on('chapter selected',function(event,data){
                if(scope.$parent.selectedChapters.indexOf(scope.list._id) == -1)
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
                if(scope.$parent.selectedChapters.length == 0)
                    return;
                if(data.event.target != element[0] && !window.event.ctrlKey)
                {
                    scope.selected = false;
                    element.css('background','rgba(0,0,0,0)');
                    element.css('color',color);
                    let index = scope.$parent.selectedChapters.indexOf(scope.list._id);
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


            scope.$on('fanfic loaded',function(event,data){
                if(scope.list._id == scope.$parent.currentIndex._id)
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
                    if(!window.event.ctrlKey)
                        scope.$parent.selectedChapters.length = 0;
                    scope.$parent.selectedChapters.push(scope.list._id);
                    scope.$parent.$apply();
                    scope.$parent.$broadcast('chapter selected',{});
                })
                .on('dblclick',function(event) {
                    if (scope.$parent.contentsLoaded){
                        if(window.localStorage)
                        {
                            let item = localStorage.getItem(scope.$parent.currentIndex._id);
                            if(item)
                            {
                                item = JSON.parse(LZString.decompress(item));
                                item.chapter.chapter = scope.$parent.chapter;
                                localStorage.setItem(scope.$parent.currentIndex._id,LZString.compress(JSON.stringify(item)));
                            }
                        }
                        scope.$parent.currentIndex = scope.list;
                        if(window.localStorage && scope.$parent.currentIndex.chapter!= null && window.localStorage.getItem(scope.list._id))
                            scope.$emit('fanficReceived',{success:true,chapter:JSON.parse(LZString.decompress(window.localStorage.getItem(scope.list._id)))});
                        else
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
        link:function(scope,element,attr){
           let root = element.find('input');
           let refresh = function(){
               scope.showHint = root[0].value == ''&& scope.list.length == 0;
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
                    if(input[i]!= '' && scope.list.indexOf(input[i]) == -1)
                    {
                        scope.list.push(input[i]);
                    }
                }
                refresh();
           };

           let removeList = function(){
               if(root[0].value=='')
                   scope.list.pop();
               refresh();
           };

           scope.removeTag = function(index)
           {
               scope.list.splice(index,1);
               scope.showHint = root[0].value == ''&& scope.list.length == 0;
           };

           scope.$on('inputHintIni',function(){
               scope.showHint = root[0].value == ''&& scope.list.length == 0;
           });

           root.on('input',function(event,data){
               refresh();
           })
               .on('keydown',function(event,data){
                   if(event.keyCode == 13)
                       addList();
                   else if(event.keyCode == 8)
                       removeList();
               });

        }
    }
});

app.directive('contenteditable', function ($compile) {
    return {
        restrict: 'A',
        require:'ngModel',
        link: function (scope, element, attrs, ctrl) {
            scope.richText = function(sign){
                loadSelection();
                let selection = window.getSelection() || document.getSelection() || document.selection.createRange();
                let range = selection.getRangeAt(0);
                if(range.collapsed)
                {
                    let innerSign = sign;
                    if(innerSign == 's')
                        innerSign = 'strike';
                    let parentElement = range.startContainer;
                    while(parentElement.nodeName != innerSign.toUpperCase())
                    {
                        parentElement = parentElement.parentElement;
                        if(!parentElement)
                            break;
                    }
                    if(parentElement && parentElement.nodeName == innerSign.toUpperCase()){
                          let ele = angular.element(parentElement);
                          let html = ele.html();
                          range.selectNode(parentElement);
                          document.execCommand('insertHTML',false,ele.html());
                        return;
                    }
                }
                switch(sign)
                {
                    case 'b':
                        document.execCommand('bold', false, null);
                        break;
                    case 'i':
                        document.execCommand('italic',false,null);
                        break;
                    case 's':
                        document.execCommand('strikethrough',false,null);
                        break;
                    case 'u':
                        document.execCommand('underline',false,null);
                        break;
                    // case 'img':
                    //     document.execCommand('insertImage',false,null);
                    //     break;
                    // case 'link':
                    //     document.execCommand('createLink',false,null);
                    //     break;
                    case 'ol':
                        document.execCommand('insertOrderedList',false,null);
                        break;
                    case 'ul':
                        document.execCommand('insertUnorderedList',false,null);
                        break;
                    default:
                        break;
                }
                recordRange();
                let html = element.html();
                html = trimHTML(html);
                element.html(html);
                recoverRange();
                recordFullRange();
            };

            let loadSelection = function(){
                let selection = window.getSelection() || document.getSelection() || document.selection.createRange();
                let range = selection.getRangeAt(0);
                if(scope.endSave)
                {
                    range.setStart(scope.startSave,scope.startSaveOffset);
                    range.setEnd(scope.endSave,scope.endSaveOffset);
                }
                else{
                    range.setStart(element[0].childNodes[0],1);
                    range.setEnd(element[0].childNodes[0],1);
                }
                selection.removeAllRanges();
                selection.addRange(range);
            };

            let trimHTML = function(html){
                html = html.replace(/<br \/>/gi,'<br>');
                html = html.replace(/<p>/gi,'<div class="paragraph">');
                html = html.replace(/<\/p>/gi,'<br class="clear"></div>');
                if(html.indexOf('<br>') == 0)
                    html = '<div class="paragraph"><br class="clear"></div>' + html.substring(4);
                if(html.indexOf('<')!=0)
                    html = '<div class="paragraph">'+html;
                html = html.replace(/<br><br>/gi,'<br class="clear"></div><div class="paragraph">');
                html = html.replace(/&nbsp;/gi,'<br class=clear>');
                html = html.replace(/(<br class="clear">)+/gi,'<br class="clear">');
                html = html.replace(/<br><\/div>/gi,'<br class="clear"></div>');
                html = html.replace(/<\/div>/gi,'<br class="clear"></div>');
                html = html.replace(/(<br class="clear">)+/gi,'<br class="clear">');
                html = html.replace(/<br>/gi,'<br class="clear"></div><div class="paragraph">');
                let str = html;
                while(str != '')
                {
                    let endMark = '</div>';
                    let startMark = '<div';
                    str = str.substring(str.indexOf(startMark)+startMark.length);
                    let endOfStartMark = str.indexOf('>');
                    str = str.substring(endOfStartMark+1);
                    let nextIndexEnd = str.indexOf(endMark);
                    let nextIndexStart = str.indexOf(startMark);
                    if(nextIndexEnd > nextIndexStart && nextIndexStart != -1)
                    {
                        let htmlIndex =  html.indexOf(str)+nextIndexStart;
                        html= html.slice(0,htmlIndex)+'<br class="clear">'+endMark+html.substring(htmlIndex);
                        str = str.slice(0,nextIndexStart)+'<br class="clear">'+endMark+str.substring(nextIndexStart);
                    }
                    str = str.substring(str.indexOf(endMark)+endMark.length);
                }

                html = html.replace(/(<br class="clear">)+/gi,'<br class="clear">');
                html = html.replace(/<\/ul><br class="clear">/gi,'</ul>');
                html = html.replace(/<\/ol><br class="clear">/gi,'</ol>');
                return html;
            };

            let recordFullRange = function(){
                let selection = window.getSelection() || document.getSelection() || document.selection.createRange();
                let range = selection.getRangeAt(0);
                scope.endSave = range.endContainer;
                scope.endSaveOffset = range.endOffset;
                scope.startSave = range.startContainer;
                scope.startSaveOffset = range.startOffset;
            };

            let recordRange = function(){
                let selection = window.getSelection() || document.getSelection() || document.selection.createRange();
                let range = selection.getRangeAt(0);
                scope.index = [];
                let endSave = range.endContainer;
                let endSaveOffset = range.endOffset;
                let startSave = range.startContainer;
                let startSaveOffset = range.startOffset;
                let end = range.endContainer;
                if(end.id == 'editBox' && end.childNodes[endSaveOffset] && end.childNodes[endSaveOffset].nodeName == 'BR')
                {

                    range.setEndAfter(end.childNodes[endSaveOffset]);
                }
                let max = end.wholeText?end.wholeText.length: end.childNodes.length;
                scope.index.push(max - range.endOffset);
                if(end.wholeText && end.wholeText.length != end.textContent.length)
                    scope.index[0] -= end.wholeText.indexOf(end.textContent);
                while(end.id != "editBox")
                {
                    let temp = end;
                    end = end.parentElement;
                    range.selectNode(temp);
                    let max = end.length || end.childNodes.length;
                    scope.index.push(max - range.endOffset);
                }

                range.setStart(startSave,startSaveOffset);
                range.setEnd(endSave,endSaveOffset);
            };

            let recoverRange = function(){
                let selection = window.getSelection() || document.getSelection() || document.selection.createRange();
                let range = selection.getRangeAt(0);
                let ele = element[0];
                let index = JSON.parse(JSON.stringify(scope.index));
                while(index.length>0 && ele.childNodes.length>0)
                {
                    let order = ele.childNodes.length - index.pop();
                    order -= 1;
                    if(order <0)
                    {
                        let max = ele.childNodes[0].wholeText?ele.childNodes[0].wholeText.length: ele.childNodes[0].childNodes.length;
                        index.push(max);
                        order = 0;
                    }
                    ele = ele.childNodes[order];
                }

                range = selection.getRangeAt(0);
                if(index.length>0)
                {
                    let diff = index.pop();
                    let diffMax = ele.wholeText?ele.wholeText.length: ele.childNodes.length;
                    range.setStart(ele,diffMax-diff);
                    range.setEnd(ele,diffMax-diff);
                }
                else{
                    let diffMax = ele.wholeText?ele.wholeText.length: ele.childNodes.length;
                    range.setStart(ele,diffMax);
                    range.setEnd(ele,diffMax);
                }

                if(ele.className == "clear")
                {
                    range.setStartBefore(ele);
                    range.setEndBefore(ele);
                }

                selection.removeAllRanges();
                selection.addRange(range);
            };


            ctrl.$render = function(){
                 element.html(ctrl.$viewValue);
            };

             element
                 .on('input',function($event){
                     recordRange();
                     let selection = window.getSelection() || document.getSelection() || document.selection.createRange();
                     let range = selection.getRangeAt(0);
                     let html = element.html();
                     html = trimHTML(html);
                     element.html(html);
                     recoverRange();
                     recordFullRange();
                     ctrl.$setViewValue(element.html());
                     scope.chapter.wordCount = element.text().length;
                     scope.index.map(function(item,i,arr){
                         if(item.chapter && item.chapter._id == scope.chapter._id)
                             item.chapter.wordCount = scope.chapter.wordCount;
                     })
                 })
                 .on('paste',function($event){
                     $event.preventDefault();
                     let data = $event.clipboardData.getData('text');
                     if(document.queryCommandSupported('insertText'))
                     {
                         document.execCommand('insertText',false,data);
                     }
                     else{
                         document.execCommand('paste',false,data);
                     }
                 })
                 .on('mouseup',function(){
                     recordFullRange();
                 });
        }

    };
});

app.controller("editCon",function($scope,$http,$rootScope,$interval,$timeout,$window,$location,fanficManager,userManager){
    $scope.backupChapter = new Map();
    $scope.db = null;
    $scope.dbLoaded = false;

    $scope.error = '';
    $scope.acceptableError = [];

    $scope.contentsLoaded = false;

   //界面
    $scope.warningTemplate = [];
    $scope.gradeTemplate = [];
    $scope.bookInfo = {};
    $scope.bookInfoDetail = null;
    $scope.currentIndex = {chapter:''};
    $scope.workIndex = [];

    $scope.bookSaving = false;
    $scope.chapterSaving = false;
    $scope.chapterAdding = false;

    //当前界面章节变量
    $scope.chapter = {};
    $scope.chapter._id = '';
    $scope.chapter.title = '';
    $scope.chapter.type = -1;
    $scope.chapter.fandom = [];
    $scope.chapter.relationships = [];
    $scope.chapter.characters = [];
    $scope.chapter.tag = [];
    $scope.chapter.intro = '';
    $scope.chapter.grade = 0;
    $scope.chapter.warning = [];
    $scope.chapter.contents = '';
    $scope.chapter.lockType = 0;
    $scope.chapter.passcode = {use:false,code:''};

   //界面属性用变量
    $scope.userSettings = null;
    $scope.fanficEdit = 113;
    $scope.setSeving = false;
    $scope.useCode = false;
    $scope.submitType = 0;
    $scope.readyType = 0;
    $scope.publishing = false;

   //当前编辑章节用变量
   $scope.tagInput = '';
   $scope.warningInput = '';
   $scope.fandomInput = '';
   $scope.introInput = '';
   $scope.currentWarningSelect='';
   $scope.selectedChapters = [];

   let chapterModified = function(item){
       if(item.contents !== $scope.chapter.contents)
           return true;
       if(item.fandom != $scope.chapter.fandom)
           return true;
       if(item.tag != $scope.chapter.tag)
           return true;
       if(item.characters != $scope.chapter.characters)
           return true;
       if(item.relationships != $scope.chapter.relationships)
           return true;
       if(item.notes != $scope.chapter.notes)
           return true;
       if(item.title != $scope.chapter.title)
           return true;
       if(item.intro != $scope.chapter.intro)
           return true;
       if(item.warning != $scope.chapter.warning)
           return true;
       if(item.grade !== $scope.chapter.grade)
           return true;
       if(item.lockType !== $scope.chapter.lockType)
           return true;
       return item.passcode.use != $scope.chapter.passcode.use || item.passcode.code != $scope.chapter.passcode.code;
   };

   $scope.loadContent = function(){
       if($scope.contentsLoaded){
           $scope.contentsLoaded = false;
           fanficManager.requestFanfic($scope.currentIndex);
       }
       else {
           let localItem = null;
           if(window.localStorage && $scope.currentIndex.chapter != '')
               localItem = window.localStorage.getItem($scope.currentIndex.chapter);
           if(localItem)
               $scope.$parent.$broadcast('fanficReceived',JSON.parse(LZString.decompress(localItem)))
           else
               fanficManager.requestFanfic($scope.currentIndex);
       }
   };

   let refreshBookInfoDetail = function(data){
           $scope.bookInfoDetail.intro = $scope.chapter.intro;
           $scope.bookInfoDetail.grade = $scope.chapter.grade;
           $scope.bookInfoDetail.fandom = $scope.chapter.fandom;
           $scope.bookInfoDetail.relationships = $scope.chapter.relationships;
           $scope.bookInfoDetail.characters = $scope.chapter.characters;
           $scope.bookInfoDetail.tag = $scope.chapter.tag;
           $scope.bookInfoDetail.warning = $scope.chapter.warning;
   };

   $scope.valueAtBit = function(num,bit){
       let result = (num >> bit) &1;
       return result;
    };

   $scope.$on('fanficReceived',function(event,data){
        if(data.success)
        {

            $scope.chapter = JSON.parse(JSON.stringify(data.chapter.chapter));
            if($scope.currentIndex.chapter == null)
                $scope.currentIndex.chapter = $scope.chapter._id;
            $scope.workIndex.map(function(item,i,arr){
                if(item._id == $scope.chapter._id && item.chapter == null) {
                    $scope.workIndex[i].chapter = {_id:$scope.chapter._id,title:$scope.chapter.title,wordCount:$scope.chapter.wordCount};
                }
            });
            if(window.localStorage)
                  localStorage.setItem($scope.currentIndex._id,LZString.compress(JSON.stringify(data.chapter)));
            $scope.contentsLoaded = true;

            if(data.isFirst)
                refreshBookInfoDetail();
            $timeout(function(){$scope.$broadcast('inputHintIni')},10);
            $scope.$broadcast('fanfic loaded',null);
        }
        else{
            $scope.contentsLoaded = true;
            $scope.error = data.message;
        }
    });

    $scope.$on('chapterSaved',function(event,data){
        $scope.chapterSaving = false;
        if(data.success)
        {
            $scope.chapter = JSON.parse(JSON.stringify(data.chapter));
            $timeout(function(){$scope.$broadcast('inputHintIni')},10);
            $scope.workIndex.map(function(item,i,arr){
                if(item._id == data.chapter._id)
                {
                    item.chapter.title = data.chapter.chapter.title;
                    item.chapter.wordCount = data.chapter.chapter.wordCount;
                }
            });
            if(data.chapter._id == $scope.workIndex[0].chapter._id)
               refreshBookInfoDetail();
        }
    });

    $scope.$on('publish finished',function(event,data){
        $scope.publishing = false;
        let rootUrl = 'http://'+$location.host();
        if(window.localStorage)
            window.localStorage.clear();
        if(data.success)
            $window.location.href = rootUrl+'/fanfic/'+data._id;
    });

    $scope.$on('bookSaved',function(event,data){
        $scope.bookSaving = false;
        if(data.success)
        {
            $scope.bookInfo = JSON.parse(JSON.stringify(data.book));
            if($scope.bookInfo.hasOwnProperty('status'))
               $scope.bookInfo.status = $scope.bookInfo.status.toString();
        }
    });

    $scope.$on('chapterAdded',function(event,data){
        $scope.chapterAdding = false;
        $scope.contentsLoaded = true;
        if(data.success)
        {
           $scope.workIndex.splice(data.insertId+1,0,data.newIndex);
           for(let i = data.inserId+2;i<$scope.workIndex.length;++i)
               $scope.workIndex[i].order++;
           $scope.bookInfo.chapterCount = data.bookInfo.chapterCount;
           $scope.bookInfo.wordCount = data.bookInfo.wordCount;
        }
    });

    $scope.$on('chapterRemoved',function(event,data){
        $scope.chapterAdding = false;
        $scope.contentsLoaded = true;
        if(data.success)
        {
            $scope.workIndex.splice(data.insertId+1,0,data.newIndex);
            for(let i = data.inserId+2;i<$scope.workIndex.length;++i)
                $scope.workIndex[i].order++;
            $scope.bookInfo.chapterCount = data.bookInfo.chapterCount;
            $scope.bookInfo.wordCount = data.bookInfo.wordCount;
        }
    });



    $scope.$on('preview ready',function(event,data){
           if(data.success)
               window.open("/fanfic/post/preview",'_blank');
    });

    $scope.$on('settingsSaveFinished',function(event,data){
        $scope.settingSaving = false;
        if(data.success)
           $scope.userSettings = data.info;
    });

    $scope.$watch('chapter.title',function(){
        $scope.$broadcast('chapterTitle changed',{id:$scope.currentIndex._id,title:$scope.chapter.title});
    });

    $scope.removeError = function(){
        $scope.error = '';
    };

    $scope.autoSave = $interval(function(){
        $scope.saveBook();
    },10*60*1000);

    $scope.autoSettingSave = $interval(function(){
      if($scope.settingSaving || $scope.fanficEdit == $scope.userSettings.fanficEdit)
          return;
       $scope.settingSaving = true;
       userManager.saveSettings({fanficEdit:$scope.fanficEdit});
    },30*1000);

    $scope.saveBook = function(){
        if(!$scope.bookSaving && !$scope.bookInfo.published)
        {
            $scope.bookSaving = true;
            $scope.bookInfo.status = Number($scope.bookInfo.status);
            let wordCount = 0;
            $scope.workIndex.map(function(item,i,arr){
                if(item.chapter)
                    wordCount += item.chapter.wordCount;
            });
            fanficManager.saveBook($scope.bookInfo);
        }

        if(!$scope.chapterSaving && !$scope.chapter.published)
        {
            $scope.chapterSaving = true;
            fanficManager.saveFanfic($scope.chapter);
        }
    };

    //警告操作
   $scope.addWarningTemplate = function(){
       if($scope.currentWarningSelect == '')
           return;
       if($scope.chapter.warning.indexOf($scope.currentWarningSelect) == -1)
           $scope.chapter.warning.push($scope.currentWarningSelect);

   };

   $scope.removeWarning = function(list){
       if($scope.chapter.warning.indexOf(list)!= -1)
       {
           let pos = $scope.chapter.warning.indexOf(list);
           $scope.chapter.warning.splice(pos,1);
       }
   };

   $scope.submitWarning = function($event){
       if($event.keyCode != 13)
           return;
       if($scope.chapter.warning.length>=10)
       {
           $scope.error = '最多只能输入10条警告！';
           $timeout($scope.removeError,10);
           return;
       }
       if($scope.chapter.warning.indexOf($scope.warningInput) == -1)
       {
           $scope.chapter.warning.push($scope.warningInput);
           $scope.warningInput = '';
       }
   };

   $scope.addChapter = function(){
      if($scope.chapterAdding)
           return;
      if($scope.selectedChapters>1)
          return;
      $scope.chapterAdding = true;
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
      $scope.workIndex.map(function(item,i,arr){
          if(item._id == data.prevId)
          {
              data.prevIndex = i;
              data.currentOrder = item.order;
          }
          if(data.prevIndex>=0 && i-data.prevIndex == 1)
              data.nextIndex = i;
      });

      if(data.prevIndex>=0)
          data.prev = $scope.workIndex[data.prevIndex]._id;
      if(data.nextIndex>=0)
          data.next = $scope.workIndex[data.nextIndex]._id;

      fanficManager.addChapter(data);
   };

   $scope.removeChapter = function(){
       let rmTag = [];
       for(let i=0; i< $scope.selectedChapters.length;++i)
       {
           let tag=  $scope.selectedChapters[i];
           $scope.workIndex.map(function(item,i,arr){
               if(item._id == tag)
                   rmTag.push(item);
           });
       }
       fanficManager.removeChapter({rm:rmTag});
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
       if($scope.bookInfo.title == '')
       {
           return false;
       }
       return $scope.chapter.contents.length > 30;
   };

   let publish = function(IfAll){
       if(!checked())
           return;
       if($scope.publishing)
           return;
       $scope.publishing = true;
       fanficManager.publish($scope.bookInfo,$scope.chapter,$scope.workIndex,IfAll);
   };

    $scope.preview = function(){
        let data = {currentIndex:$scope.currentIndex,book:$scope.bookInfo,chapter:$scope.chapter,index:$scope.workIndex};
        fanficManager.preview(data);
    };

    $scope.submit = function(){
       switch($scope.submitType)
       {
           case 0:
               publish(false);
               break;
           case 1:
               saveDraft();
               break;
           case 2:
               publish(true);  
               break; 
       }
   };

   $scope.$on('initialisation completed',function(){
       let initialize = function(){
           $scope.loadContent();
       };
       let mainPanel = document.getElementById("main");
       let editorPanel = document.getElementById("fanficEditor");
       mainPanel.style.minHeight = (editorPanel.scrollHeight+350)+'px';
       initialize();
   });
});


