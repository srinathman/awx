export default ['$scope', '$stateParams', '$state', '$filter', 'GetBasePath', 'QuerySet', '$interpolate',
    function($scope, $stateParams, $state, $filter, GetBasePath, qs, $interpolate) {

        let pageSize = $scope.querySet ? $scope.querySet.page_size || 20 : $stateParams[`${$scope.iterator}_search`].page_size || 20,
            queryset, path;

        $scope.pageSize = pageSize;

        function init() {

            let updatePaginationVariables = function() {
                $scope.current = calcCurrent();
                $scope.last = calcLast();
                $scope.pageRange = calcPageRange($scope.current, $scope.last);
                $scope.dataRange = calcDataRange();
            };

            updatePaginationVariables();

            $scope.$watch('collection', function(){
                updatePaginationVariables();
            });
        }

        $scope.dataCount = function() {
            return $filter('number')($scope.dataset.count);
        };

        $scope.toPage = function(page) {
            if(page === 0) {
                return;
            }
            if (GetBasePath($scope.basePath) || $scope.basePath) {
                path = GetBasePath($scope.basePath) || $scope.basePath;
            } else {
                let interpolator = $interpolate($scope.basePath);
                path = interpolator({ $stateParams: $stateParams });
            }
            if($scope.querySet) {
                // merging $scope.querySet seems to destroy our initial reference which
                // kills the two-way binding here.  To fix that, clone the queryset first
                // and merge with that object.
                let origQuerySet = _.cloneDeep($scope.querySet);
                queryset = _.merge(origQuerySet, { page: page });

            }
            else {
                queryset = _.merge($stateParams[`${$scope.iterator}_search`], { page: page });
            }
            if(!$scope.querySet) {
                $state.go('.', {
                    [$scope.iterator + '_search']: queryset
                }, {notify: false});
            }
            qs.search(path, queryset).then((res) => {
                if($scope.querySet) {
                    // Update the query set
                    $scope.querySet = queryset;
                }
                $scope.dataset = res.data;
                $scope.collection = res.data.results;
            });
            $scope.pageRange = calcPageRange($scope.current, $scope.last);
            $scope.dataRange = calcDataRange();
        };

        function calcLast() {
            return Math.ceil($scope.dataset.count / pageSize);
        }

        function calcCurrent() {
            if($scope.querySet) {
                return parseInt($scope.querySet.page || '1');
            }
            else {
                return parseInt($stateParams[`${$scope.iterator}_search`].page || '1');
            }
        }

        function calcPageRange(current, last) {
            let result = [],
                maxVisiblePages = $scope.maxVisiblePages ? parseInt($scope.maxVisiblePages) : 10,
                pagesLeft,
                pagesRight;
            if(maxVisiblePages % 2) {
                // It's an odd number
                pagesLeft = (maxVisiblePages - 1) / 2;
                pagesRight = ((maxVisiblePages - 1) / 2) + 1;
            }
            else {
                // Its an even number
                pagesLeft = pagesRight = maxVisiblePages / 2;
            }
            if (last < maxVisiblePages) {
                // Don't have enough pages to exceed the max range - just show all of them
                result = _.range(1, last + 1);
            }
            else if(current === last) {
                 result = _.range(last + 1 - maxVisiblePages, last + 1);
            }
            else {
                let topOfRange = current + pagesRight > maxVisiblePages + 1 ? (current + pagesRight < last + 1 ? current + pagesRight : last + 1) : maxVisiblePages + 1;
                let bottomOfRange = (topOfRange === last + 1) ? last + 1 - maxVisiblePages : (current - pagesLeft > 0 ? current - pagesLeft : 1);
                result = _.range(bottomOfRange, topOfRange);
            }
            return result;
        }

        function calcDataRange() {
            if ($scope.current === 1 && $scope.dataset.count < parseInt(pageSize)) {
                return `1 - ${$scope.dataset.count}`;
            } else if ($scope.current === 1) {
                return `1 - ${pageSize}`;
            } else {
                let floor = (($scope.current - 1) * parseInt(pageSize)) + 1;
                let ceil = floor + parseInt(pageSize) < $scope.dataset.count ? floor + parseInt(pageSize) : $scope.dataset.count;
                return `${floor} - ${ceil}`;
            }
        }

        init();
    }
];
