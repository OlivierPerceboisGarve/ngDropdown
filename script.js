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
	$scope.foo = 3;
})
.directive("dropdown", ['$sce' , '$compile',
				function($sce,    $compile) {
	var DDO = {
		restrict: 'E',
		require: '?ngModel',
		template: function(scope, el){//TODO rename vars
			return	'<div ng-click="dropdown.show = !dropdown.show;" tabindex="0"'
						+'ng-class="{open: dropdown.show, closed: !dropdown.show}"'
						+'ui-keypress="{'
							+" 'shift-tab': 'tab();',"
							+" 'tab': 'tab();',"
							+" 'up': 'up();',"
							+" 'down': 'down($event);'"
							+'}"'
						+'>'
						+'<input type="hidden" name="'+el.name+'"  />'
						+'<span ng-bind-html="dropdown.selection" class="selection"></span>'
						+'<ul ng-show="dropdown.show" class="wrap" ng-transclude></ul>'
					+'</div>';
		},
		transclude: true,
		scope: true,
		controller: ['$scope', '$element', '$timeout',
			function( $scope,   $element,   $timeout) {
			$scope.dropdown = {
				value : false,
				show : false,
				firstOptionSelected : false				
			};

			var options = this.options = [];

			$element.find('div')[0].onblur = function(){
				$scope.hasFocus();
			}

			this.hasFocus = function(){
				$scope.hasFocus();
			}

			$scope.hasFocus = function(){
				$timeout(function(){
					var hasFocus = false;
					options.forEach(function(el){
						if (el === document.activeElement){
							hasFocus = true;
						}
					});
					if (!hasFocus){
						if ($element.find('div')[0] === document.activeElement){
							hasFocus = true;
						}
					}
					if (!hasFocus){
						$scope.hide();
					}
				}, 0);
			}

			$scope.hide = function(){
				$scope.dropdown.show = false;
			}
			
			this.addOption = function (option) {
				var rank = this.options.push(option[0]);
				return rank;
			};

			$scope.getOptionByValueAttr = function(valueAttr){
				var out = false;
				options.forEach(function(opt){
					if (parseInt(opt.value, 10) === valueAttr){
						out = opt;
					}					
				});
				return out;
			}

			this.preselect = function preselect(el) {
				if (!$scope.firstOptionSelected){
					$scope.firstOptionSelected = true;
					this.select(el);
				}
			};

			$scope.select = this.select = function select(el) {
				$scope.dropdown.selection = $sce.trustAsHtml(el.html());
				$scope.dropdown.value = el.attr('value');
				$timeout(function(){
					$scope.dropdown.show = false;
					$element.find('div')[0].focus();
				}, 0);
			};

			$scope.tab = $scope.up = function(){
				$scope.dropdown.show = false;
			};

			$scope.down = function($event){
				$event.preventDefault();
				$event.stopPropagation();
				$scope.dropdown.show = true;
				$timeout(function(){
					//equivalent to jQuery('li.option')[0].focus(); //yep, verbose.
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
			return { post: function($scope, el, attr, ctrl) {
			$scope.$watch('ctrl.$viewValue',function (newVal, oldVal) {	
					if (angular.isUndefined(oldVal) && !isNaN(ctrl.$viewValue) ){
						var el = $scope.getOptionByValueAttr(ctrl.$viewValue);
						if (el){
							$scope.select(angular.element(el));	
						}
					}
				});
				$scope.$watch('dropdown.value',function (newVal, oldVal) {	
					console.log(newVal, oldVal);
					if (newVal){
						ctrl.$setViewValue(newVal);
					}
				});}
			}
		}
	};
	return DDO;
}])
.directive('ddli',[ '$interpolate', '$compile', '$timeout', 
		function(    $interpolate,   $compile,   $timeout) {
	var DDO = {
		restrict: 'E',
		require: '^dropdown',
		template: 	'<li class="option" tabindex="0" ng-click="selectEl()"'
						+' ui-keypress="{'
							+" 'enter':		'selectEl();', "
							+" 'up':		'up($event);', "
							+" 'down':		'down($event);'"
						+'}" >'
					+'</li>',
		transclude: true,
		replace: true,
		scope: true,
		compile: function(el, attrs){
			return {post: function(scope, el, attrs, dropdownCtrl,  $transclude) {

				$transclude(scope, function(nodes) {
					el.append(nodes);
				}); 

				var interpolateTextFn = $interpolate(el.text(), true);
				var interpolateDefaultFn = $interpolate(attrs, true);
				var state = {
					text: el.text(),
					default: attrs.default
				}; 

			    if (interpolateTextFn){
			        scope.$watch(update, render,true);
			    } else {
			      	render(state);
			    }
			      
			    function update() {
			        if (interpolateTextFn) {
			        	state.text = interpolateTextFn(scope);
			    	}
			    	return state;
			    }
			    function render(value) {
			    	el.text(value.text);
			    	dropdownCtrl.preselect(el);
			    	if (angular.isDefined(value.default) && value.default !== 'false'){
			    		dropdownCtrl.select(el);
			    	}			    	
			    }

			    scope.rank = dropdownCtrl.addOption(el);//let the dropdown controller know about this option element and receive an iterator back
								
				el[0].onblur = function(){
					dropdownCtrl.hasFocus();
				}

		    	//maintains the focus under the mouse cursor
				el[0].onmousemove= function(){
					if (this !== document.activeElement){
						this.focus();
					}
				}
	      
				scope.selectEl = function() {
					dropdownCtrl.select(el);
				};

				scope.up = function($event){
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdownCtrl.options[scope.rank-2])){
						dropdownCtrl.options[scope.rank-2].focus();
					} else {
						var len = dropdownCtrl.options.length;
						dropdownCtrl.options[len-1].focus();
					}
				};

				scope.down = function($event){
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdownCtrl.options[scope.rank])){
						dropdownCtrl.options[scope.rank].focus();
					} else {
						dropdownCtrl.options[0].focus();
					}
				};
			}}
		}
	};
	return DDO;
}]);

}());