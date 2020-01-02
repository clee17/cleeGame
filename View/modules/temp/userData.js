angular.module('userData',['ngCookies','ngRoute'])
  .service('_userLog',function($http,$cookies){
        this._status = 0;
        this._currentPage = 0;
        this._subIndex = 0;
        this._ip = '';
        this._logged = false;
        this.validate = async function(subIndex){
            console.log('started requested status');
            if(subIndex != undefined)
               this._subIndex = subIndex;
            this._status = 0;
            let data = {
                page: this._currentPage,
                subIndex: this._currentPage.toString()+this._subIndex.toString()
            };
            let req = Base64.encode(JSON.stringify(data));
            let response = await $http.post('/admin/status/',{data:req});
            let res = JSON.parse(Base64.decode(response.data.value));
            this._status = res.status;
            this._ip = res.ip;
            if(this._subIndex == 0)
                this._logged =  this._status>0 && this._status< 400;
            res.status = null;
            res.ip = null;
            console.log('end of request status');
            return res;
        };

        this.logged =function(){
            return this._logged;
        }

});
