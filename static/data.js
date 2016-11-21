(function() {
    var getDayText = function(moment) {
        return moment.format('MMM D');
    };

    var getDaysText = function(week) {
        var startOfWeek = moment().week(week).isoWeekday(1);
        var endOfWeek = moment().week(week).isoWeekday(7);

        return startOfWeek.month() == endOfWeek.month()
            ? getDayText(startOfWeek) + '–' + endOfWeek.format('D')
            : getDayText(startOfWeek) + '—' + getDayText(endOfWeek);
    };

    var drawBars = function(chart, options, data, xScale, yScale, topValues, bottomValues, hoverHandler) {
        var barWidth = xScale(data.weeks[1]) - xScale(data.weeks[0]);

        data.weeks.forEach(week => {
            var bar = chart.append('g')
                .classed('chart__bar', true)
                .classed('chart__bar__' + week, true)
                .attr('transform', 'translate(' + xScale(week) + ', 0)')
                .on('mouseover', function() {
                    hoverHandler(week);
                });

            bar.append('rect')
                .classed('chart__bar_sales', true)
                .attr('y', function(d) { return yScale(topValues(data)[week]); })
                .attr('height', function(d) { return options.height - yScale(topValues(data)[week]); })
                .attr('width', barWidth);

            bar.append('rect')
                .classed('chart__bar_guests', true)
                .attr('y', function(d) { return yScale(bottomValues(data)[week]); })
                .attr('height', function(d) { return options.height - yScale(bottomValues(data)[week]); })
                .attr('width', barWidth);
        });
    };

    var setBarSelected = function(chart, week) {
        chart.selectAll('.chart__bar').classed('chart__bar_selected', false);
        chart.selectAll('.chart__bar__' + week).classed('chart__bar_selected', true);
    };

    var drawBarChart = function(selections, selection, data, maxValue, topValues, bottomValues) {
        var options = {
            width: 300,
            height: 150,
            xScaleHeight: 20,
            xScaleLineHeight: 1
        };

        var chart = selection.append('svg')
            .attr('width', options.width)
            .attr('height', options.height + options.xScaleHeight);

        var x = d3.scaleLinear()
            .range([0, options.width])
            .domain([+data.min.week, +data.max.week + 1]);

        var y = d3.scaleLinear()
            .range([options.height, 0])
            .domain([0, maxValue(data)]);

        drawBars(chart, options, data, x, y, topValues, bottomValues, function(week) {
            highlightWeek(selections, data, week);
        });

        var xScaleLine = chart.append('g')
            .attr('transform', 'translate(0, ' + options.height + ')');

        xScaleLine.append('text')
            .classed('chart__x-scale-date', true)
            .attr('x', 0)
            .attr('y', options.xScaleHeight)
            .text(getDayText(moment().week(data.min.week).isoWeekday(1)));

        xScaleLine.append('text')
            .classed('chart__x-scale-date', true)
            .attr('text-anchor', 'end')
            .attr('x', options.width)
            .attr('y', options.xScaleHeight)
            .text(getDayText(moment().week(data.max.week).isoWeekday(7)));

        chart.on('mouseout', function() {
            highlightLastWeek(selections, data);
        });

        highlightLastWeek(selections, data);
    };

    var drawBarCharts = function(selector1, selector2, data) {
        var selections = [ d3.select(selector1), d3.select(selector2) ];

        drawBarChart(selections, selections[0], data, function(data) {
            return data.max.sales;
        }, function(data) {
            return data.sales;
        }, function(data) {
            return data.users;
        });

        drawBarChart(selections, selections[1], data, function(data) {
            return data.max.arpg;
        }, function(data) {
            return data.arpg;
        }, function(data) {
            return data.arps;
        });
    };

    var setCounters = function(data, week) {
        d3.select('.placeholder__week-number').text(week);
        d3.select('.placeholder__week-days').text(getDaysText(week));

        d3.select('.placeholder__week-sales').text(data.sales[week]);
        d3.select('.placeholder__week-sales-anonymous').text(data.anonymousSales[week]);
        d3.select('.placeholder__week-guests').text(data.users[week]);

        d3.select('.placeholder__week-arps').text(data.arps[week]);
        d3.select('.placeholder__week-arpg').text(data.arpg[week]);
    };

    var highlightWeek = function(selections, data, week) {
        setCounters(data, week);

        selections.forEach(function(selection) {
            setBarSelected(selection, week);
        });
    };

    var highlightLastWeek = function(chart, data) {
        var week = data.weeks[data.weeks.length - 1];
        highlightWeek(chart, data, week);
    };

    d3.json('/data/sales-and-guests.json', function(data) {
        drawBarCharts('.chart__users-and-sales', '.chart__arpg-and-arps', data);
    });
})();