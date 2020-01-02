var app = angular.module('cleeUtility',[]);

app.service('_utilityBasic',function() {
    this.deepJsonACopy = function (TargetArray, SourceArray) {
        if (!Array.isArray(TargetArray)) {
            throw "CleeUtility_UtilityBasic: please provide an valid targetArray.";
            return false;
        }

        if (!Array.isArray(SourceArray)) {
            throw "CleeUtility_UtilityBasic: please provide an valid targetArray.";
            return false;
        }

        if (SourceArray[0] && !(SourceArray[0].constructor === Object)) {
            throw "CleeUtility_UtilityBasic: the array passed do not contain a Json object.";
            return false;
        }
        if (TargetArray.length != 0) {
            throw "CleeUtility-_UtilityBasic: the target array is not empty.";
            return false;
        }

        for (var i = 0; i < SourceArray.length; ++i) {
            let str = JSON.stringify(SourceArray[i]);
            TargetArray[i] = JSON.parse(str);
        }
        return true;
    }
});

app.service('_utilityTrans',function(){

    this.dataOptionIndex = new Map();
    this.dataOptionIndex['code'] = '码文';
    this.dataOptionIndex['md51'] = '前段md5';
    this.dataOptionIndex['md52'] = '后段md5';
    this.dataOptionIndex['md53'] = '全段md5';
    this.dataOptionIndex['user'] = '用户';
    this.dataOptionIndex['null'] = '暂无';

    this.translateTableOption=function(name){
        if(this.dataOptionIndex[name]!=null)
            return this.dataOptionIndex[name];
        else
            return '不知名';
    }

});

app.service('_utilityStyle',function(){
   this.widthIndex = new Map();
   this.widthIndex['code'] = '5rem';
   this.widthIndex['md5'] = '5rem' ;

   this.heightIndex = new Map();
   this.heightIndex[10000] = '3rem';

   this.getWidthDataCell = function(name)
   {
       if(this.widthIndex[name]!=null)
           return this.widthIndex[name];
       else
           return '1rem';
   };

   this.getHeightByIndex = function(index){
       if(this.heightIndex[index] != null)
       {
           return this.heightIndex[index];
       }
       else{
           return '1rem';
       }
   };
});