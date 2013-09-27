'use strict';

/* App Module */

angular.module('learner-services', ['ngResource']);
angular.module('learner-controllers', []);
angular.module('learner-constants', []);
angular.module('learner-directives', ['learner-services']);
angular.module('learner-filters', []);


angular.module('learner', ['ngSanitize',
                           '$strap',
                           'learner-controllers',
                           'learner-filters',
                           'learner-services',
                           'learner-directives',
                           'rrh-common',
                           'rrh-ui']).
  config(['$routeProvider','$locationProvider', '$httpProvider', function($routeProvider,$locationProvider, $httpProvider) {
  
	  // interceptor to detect authentication errors
	  var interceptor = ['$rootScope', '$q', function (scope, $q) {

	        function success(response) {
	            return response;
	        }

	        function error(response) {
	            var status = response.status;

	            if (status == 401) {
	                var deferred = $q.defer();
	                var req = {
	                    config:response.config,
	                    deferred:deferred
	                }
	                window.location = "./leanerhome.htm";
	            }
	            // otherwise
	            return $q.reject(response);

	        }

	        return function (promise) {
	            return promise.then(success, error);
	        }

	    }];
	    $httpProvider.responseInterceptors.push(interceptor);	  
	  
	  
  $routeProvider.
      when('/baskets', {templateUrl: 'resources/scripts/rrh/learner/app/partials/basket-list.html',   controller: 'BasketListCtrl'}).
      when('/baskets/:basketId', {templateUrl: 'resources/scripts/rrh/learner/app/partials/basket-detail.html', controller: 'BasketDetailCtrl'}).
      when('/basketState/:basketStateId', {templateUrl: 'resources/scripts/rrh/learner/app/partials/basket-detail.html', controller: 'BasketDetailCtrl'}).
      when('/basketState/:basketStateId/basketItemStates/:basketItemStateId', {templateUrl: 'resources/scripts/rrh/learner/app/partials/basket-item.html', controller: 'BasketItemCtrl'}).
      otherwise({redirectTo: '/baskets'});
}])
