(function() {
console.log('angular : ', angular);
angular.module('testdirective', ['ngResource', 'ngSanitize', 'ui.keypress', 'ngMockE2E'])
.run(function($httpBackend) {
  $httpBackend.whenGET('api/vegies').respond(
    [{id: 1, name: 'lettuce'}, {id: 2, name: 'carots'}, {id: 3, name: 'pumpkin'}]
  );
  $httpBackend.whenGET('api/fishes').respond(
    [{id: 1, name: 'brochet'}, {id: 2, name: 'matjes'}, {id: 3, name: 'sandre'}, {id: 4, name: 'turbot'}]
  );
})
.factory('vegiesFactory', function($resource){
 return  $resource('api/vegies');
})
.factory('fishesFactory', function($resource){
 return  $resource('api/fishes');
}) 
.controller('food', function($scope, vegiesFactory, fishesFactory){
	$scope.vegies = vegiesFactory.query();
	$scope.fishes = fishesFactory.query();
})
.directive("dropdown", ['$sce' ,
				function($sce) {
	var DDO = {
		restrict: 'E',
		require: '?ngModel',
		template: '<div ng-click="dropdown.show = !dropdown.show;" tabindex="0" ng-class="{open: dropdown.show, closed: !dropdown.show}" ui-keypress="{\'shift-tab\': \'tab();\', \'tab\': \'tab();\', \'up\': \'up();\', \'down\': \'down($event);\'}"><input type="hidden" ng-model="dropdown.value" /><span ng-bind-html="dropdown.selection" class="selection"></span><ul ng-show="dropdown.show" class="wrap" ng-transclude></ul></div>',
		transclude: true,
		scope: true,
		//priority: 100,
		controller: ['$scope', '$element', '$timeout',
			function( $scope,   $element,   $timeout) {
			$scope.dropdown = {
				selection : 'removeme',
				value : false,
				show : false
			};

			this.defaultIsSet = false;
			$scope.firstOptionSelected = false;
			//var options = 
			this.options = [];
			var indexDefault = $scope.indexDefault = 0;
			this.addOption = function (option) {
				return this.options.push(option[0]);
			};

			this.select = function select(el, isDefault) {
				if (!$scope.firstOptionSelected || isDefault){
					$scope.firstOptionSelected = true;
					$scope.dropdown.selection = $sce.trustAsHtml(el.html());
					$scope.dropdown.value = el.attr('value');
				}
			};

			$scope.tab = $scope.up = function(){
				$scope.dropdown.show = false;
			};

			$scope.down = function($event){
				$event.preventDefault();
				$event.stopPropagation();
				$scope.dropdown.show = true;
				$timeout(function(){
					var lis = $element.find('li');
					var focused = false;
					for (var i = 0, len = lis.length; i < len; i++){
						if (angular.element(lis[0]).hasClass('option')){
							lis[0].focus();
							focused = true;
						}	
					}
				},
				0);
			};
		}],

		compile: function compile(el, attr){
			return {
				pre: function($scope, el, attr, ngModel) {
					$scope.$watch('dropdown.value',function (newVal) {	
						ngModel.$setViewValue(newVal);
					});
				}				
			}

		}

	};
	return DDO;
}])
.directive('ddli',[ '$interpolate', function($interpolate) {
	var DDO = {
		restrict: 'E',
		require: '^dropdown',
		template: '<li class="option" tabindex="0" ng-click="selectEl()" ui-keypress="{\'up\': \'up($event);\', \'down\': \'down($event);\'}" ></li>',//
		transclude: true,
		replace: true,
		//priority: 90,
		scope: true,
		compile: function(el, attrs){
			return function(scope, el, attrs, controller,  $transclude) {
				  $transclude(scope, function(nodes) {
				    el.append(nodes);
				  }); 
				console.log('ddli compile attrs', attrs);
				var interpolateTextFn = $interpolate(el.text(), true);
				var interpolateDefaultFn = $interpolate(attrs, true);
				var state = {text: el.text(), default: attrs.default}; 
				var dropdown = controller;
				var rank = dropdown.addOption(el);
				console.log('ddli dropdown options', dropdown.options);
			    if (interpolateTextFn){
			      	console.info('ddli WATCH');
			        scope.$watch(update, render,true);
			    } else {
			      	console.log('ddli compile no interpolateFn go render');
			      	render(state);
			    }
			      
			    function update() {
			        console.log('ddli update');
			        if (interpolateTextFn) {
			        	console.log('ddli compile update if interpolateFn');
			        	state.text = interpolateTextFn(scope);
			        	//state.default = interpolateDefaultFn(scope);
			    	}
			    	return state;
			    }
			    function render(value) {
			    	console.log('ddli compile render', value.text);
			    	el.text(value.text);
			    	console.warn('ddli compile value.default', typeof value.default, value.default);
			    	dropdown.select(el);
			    	if (value.default === 'true'){
			    		console.info('ddli select default !!!');
			    		dropdown.select(el, true);
			    		//dropdown.setDefault(rank);
			    		//dropdown.
			    	}
			    	
			    }
	      
				scope.selectEl = function() {
					dropdown.select(el);
				};


				scope.up = function($event){
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdown.options[rank-2])){
						dropdown.options[rank-2].focus();
					} else {
						var len = dropdown.options.length;
						dropdown.options[len-1].focus();
					}
				};

				scope.down = function($event){
					console.info('down', rank);
					console.info('down', dropdown.options[rank]);
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdown.options[rank])){
						dropdown.options[rank].focus();
					} else {
						dropdown.options[0].focus();
					}
				};
			}

		}

	};
	return DDO;
}]);

}());