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
			return	'<div ng-click="dropdown.show = !dropdown.show;" tabindex="0" ng-class="{open: dropdown.show, closed: !dropdown.show}" ui-keypress="{\'shift-tab\': \'tab();\', \'tab\': \'tab();\', \'up\': \'up();\', \'down\': \'down($event);\'}">'
						+'<input type="hidden" name="'+el.name+'"  />'//ng-model="dropdown.value"
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
				console.log('DD blur div', this.hasFocus, document.activeElement);//, arguments);
				$scope.hasFocus();
			}

			console.info('$scope ', $scope);

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
						/*if ($element[0] === document.activeElement){
							console.error('bouououou');
							hasFocus = true;
						}*/
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

			$scope.getOptionByValueAttr = this.getOptionByValueAttr = function(valueAttr){
				var out;
				options.forEach(function(opt){
					if (parseInt(opt.value, 10) === valueAttr){
						out = opt;
					}					
				});
				return out;
			}


			this.preselect = function preselect(el) {
				console.warn('preselect', el, $scope.firstOptionSelected);
				if (!$scope.firstOptionSelected){
					$scope.firstOptionSelected = true;
					this.select(el);
				}
			};

			$scope.select = this.select = function select(el) {
				console.log('select', el);
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
			
			//console.info('DD compile ngModel.viewValue', this);
			var foo = el.find('div').find('input').eq(0);
			//console.info('DD compile ', foo, foo.controller('ngModel'));

			return { post: function($scope, el, attr, ctrl) {
				//console.info('DD LINK  el.controller("ngModel")', el, el.find('div'), el.find('div').find('ddli').length, el.controller('ngModel'), '- ctrl.$viewValue :', ctrl.$viewValue); //ngModel, $scope.dropdown.value
				$scope.$watch('ctrl.$viewValue',function (newVal, oldVal) {	
					if (angular.isUndefined(oldVal) && !isNaN(ctrl.$viewValue) ){
						//console.log('DD LINK set default from MODEL. ctrl.$viewValue', ctrl.$viewValue);
						var el = $scope.getOptionByValueAttr(ctrl.$viewValue);
						$scope.select(angular.element(el));

					}
				});
				$scope.$watch('$scope.dropdown.value',function (newVal, oldVal) {	
					//console.info('=====> DD LINK watch on $scope.dropdown.value $setViewValue newVal', newVal, oldVal);
					if (angular.isDefined(oldVal)){
						//ctrl.$setViewValue(newVal);
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
							//+"'shift-tab':	'tab1();', "
							+"'enter':		'selectEl();', "
							//+"'tab':		'tab1();', "
							+"'up':			'up($event);', "
							+"'down':		'down($event);'"
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
			    	//console.log('ddli render', scope.rank, dropdownCtrl, angular.isDefined(value.default));
			    	dropdownCtrl.preselect(el);
			    	if (angular.isDefined(value.default) && value.default !== 'false'){
			    		//console.log('ddli preselect');
			    		dropdownCtrl.select(el);
			    	}			    	
			    }
								
				scope.rank = dropdownCtrl.addOption(el);//let the dropdown controller know about this option element and receive an iterator back
				//console.log('ddli rank', scope.rank);
				if (scope.rank === 1){
					//dropdownCtrl.select($compile(el, true));
				}

				el[0].onblur = function(){
					//console.log('ddli blur', scope);//, dropdownCtrl, document.activeElement, arguments);
					dropdownCtrl.hasFocus();
				}

		    	//maintains the focus under the mouse cursor
				el[0].onmousemove= function(e){
					if (this !== document.activeElement){
						this.focus();
					}
				}
	      
				scope.selectEl = function() {
					dropdownCtrl.select(el);
				};

				//scope.tab1 = function(){
				//	console.log('dropdownCtrl', dropdownCtrl);
				//}


				scope.up = function($event){
					console.log('up', scope.rank);
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdownCtrl.options[scope.rank-2])){
						dropdownCtrl.options[scope.rank-2].focus();
					} else {
						var len = dropdownCtrl.options.length;
						dropdownCtrl.options[len-1].focus();
					}
					

					//$timeout(function(){
						//dropdownCtrl.hasFocus();
					//console.log('ddli up refocus has Focus', dropdownCtrl.options[rank], '- 2 : ', dropdownCtrl.options[rank-1].hasFocus , '- 3 : ', dropdownCtrl.options[rank-2].hasFocus  );
					//console.log('doc active el', document.activeElement);
					//}, 100);
				};

				scope.down = function($event){
					console.log('down', scope.rank);
					$event.preventDefault();
					$event.stopPropagation();
					if (angular.isDefined(dropdownCtrl.options[scope.rank])){
						dropdownCtrl.options[scope.rank].focus();
						console.log('ddli down refocus', document.activeElement);
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