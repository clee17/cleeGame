var MathUtil = {
    sum: (function () {
        'use strict';
        return function fun(num) {
            if (num <= 1) {
                return 1;
            } else {
                return num + fun(num - 1);
            }
        }
    })()
};

