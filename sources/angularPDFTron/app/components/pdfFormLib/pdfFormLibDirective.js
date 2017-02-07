'use strict';


pdfFormLibModule.directive('pdfform',['$window', function($window) {
  return {
    restrict:'E',
    templateUrl: "components/pdfFormLib/pdfFormLibTemplate.html"
  }
}]);


pdfFormLibModule.directive('script', ["$compile",function($compile) {
  return {
    restrict: 'E',
    scope: false,
    link: function(scope, element, attr) {
      if (attr.type === 'text/javascript-lazy') {
        if (attr.src) {
             var domElem = '<script src="'+attr.src+'" async defer></script>';
             $(element).append($compile(domElem)(scope));
        } else {
          var code = elem.text();
          var f = new Function(code);
          f();
        }

      };
    }
  };
}]);



// deprecated - only for tests purposes
pdfFormLibModule.directive('script2', ["$compile",function($parse, $rootScope, $compile) {
return {
    restrict: 'E',
    scope: false,
    terminal: true,
    link: function(scope, element, attr) {
        if (attr.ngSrc) {
             var domElem = '<script src="'+attr.ngSrc+'" async defer></script>';
             $(element).append($compile(domElem)(scope));
        }
    }
};
}]);
