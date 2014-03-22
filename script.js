(function() {
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

				this.originalFocus = $scope.originalFocus = document.activeElement;
				var options = this.options = [];
				this.selectedRank = false;

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
					var el = false, rank = false;
					options.forEach(function(opt, i){
						if (parseInt(opt.value, 10) === valueAttr){
							el = opt;
							rank = i+1;
						}					
					});
					return {el: el,rank: rank};
				}

				this.preselect = function preselect(el, rank) {
					if (!$scope.firstOptionSelected){
						$scope.firstOptionSelected = true;
						this.select(el, rank, 'nofocus');
					}
				};

				$scope.setSelectedRank = function(rank){
					this.selectedRank = rank;
				}

				$scope.select = this.select = function select(el, rank, nofocus) {
					console.info('select rank : ', rank, 'el: ',el);
					$scope.setSelectedRank(rank);
					$scope.dropdown.selection = $sce.trustAsHtml(el.html());
					$scope.dropdown.value = el.attr('value');
					$timeout(function(){
						if ($scope.dropdown.show  !== false){
							$scope.dropdown.show = false;	
						}
						
						if(angular.isUndefined(nofocus) || (nofocus === false)){
							$element.find('div')[0].focus();	
						}
					}, 0);
				};

				$scope.tab = $scope.up = function(){
					$scope.dropdown.show = false;
				};

				$scope.down = function($event){
					$event.preventDefault();
					$event.stopPropagation();
						if ($scope.dropdown.show  !== false){
							$scope.dropdown.show = false;	
						}
					var select = this.select;
					var selectedRank = this.selectedRank;
					$timeout(function(){
						//equivalent to jQuery('li.option')[0].focus(); //yep, verbose.
						var lis = $element.find('li');
						console.log('lis', lis, lis.length, 'this.selectedRank', selectedRank);
						var rankToSelect = selectedRank+1;
						if (selectedRank === lis.length){
							rankToSelect = 1;
						}

						select(lis.eq(rankToSelect-1), rankToSelect);
						/*

						//opens the dropout with tab browsing. Not native behavior, so should be made optional.

						var focused = false;
						for (var i = 0, len = lis.length; i < len; i++){
							if (angular.element(lis[0]).hasClass('option')){
								lis[0].focus();
								focused = true;
							}	
						}*/
					},
					0);
				};
			}
		],

		compile: function compile(el, attr){
			return { post: function($scope, el, attr, ctrl) {
				$scope.$watch('ctrl.$viewValue',function (newVal, oldVal) {	
						if (angular.isUndefined(oldVal) && !isNaN(ctrl.$viewValue) ){
							var opt = $scope.getOptionByValueAttr(ctrl.$viewValue);
							var el = opt.el, rank = opt.rank;
							if (el){
								console.warn('rank', rank);
								$scope.select(angular.element(el), rank, 'nofocus');	
							}
						}
					});
					$scope.$watch('dropdown.value',function (newVal, oldVal) {	
						if (newVal){
							ctrl.$setViewValue(newVal);
						}
					});
				}
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
			return {post: function(scope, el, attrs, dropdownCtrl, $transclude) {

				$transclude(scope, function(nodes) {
					el.append(nodes);
				}); 

				scope.rank = dropdownCtrl.addOption(el);//let the dropdown controller know about this option element and receive an iterator back


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
			    	console.log('render : ', scope.rank, 'val', value);
			    	dropdownCtrl.preselect(el, scope.rank);
			    	if (angular.isDefined(value.default) && value.default !== 'false'){
			    		console.info('render attribute');
			    		dropdownCtrl.select(el, scope.rank, 'nofocus');
			    	}			    	
			    }

								
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
					dropdownCtrl.select(el, scope.rank);
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