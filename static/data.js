var updateData;

(function() {
    var getDayText = function(moment) {
        return moment.format('MMM D');
    };

    var getDaysText = function(week) {
        var startOfWeek = moment().week(week).weekday(1);
        var endOfWeek = moment().week(week).weekday(7);

        return startOfWeek.month() == endOfWeek.month()
            ? getDayText(startOfWeek) + '–' + endOfWeek.format('D')
            : getDayText(startOfWeek) + '—' + getDayText(endOfWeek);
    };

    var getDaysCountText = function(days) {
        return days + ' workday' + (days > 1 ? 's' : '');
    };

    var drawBars = function(chart, options, data, xScale, yScale, topValues, bottomValues, daysValues, hoverHandler) {
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
                .classed('chart__bar_one', true)
                .attr('y', function(d) { return yScale(topValues(data)[week]); })
                .attr('height', function(d) { return options.height - yScale(topValues(data)[week]); })
                .attr('width', barWidth);

            bar.append('rect')
                .classed('chart__bar_two', true)
                .attr('y', function(d) { return yScale(bottomValues(data)[week]); })
                .attr('height', function(d) { return options.height - yScale(bottomValues(data)[week]); })
                .attr('width', barWidth);

            var workDays = daysValues(data)[week];

            if (workDays != options.usualWorkDays) {
                bar.append('text')
                    .classed('chart__bar__text', true)
                    .attr('text-anchor', 'middle')
                    .attr('x', barWidth * 0.5)
                    .attr('y', options.height * 0.94)
                    .text(workDays);
            }
        });
    };

    var setBarSelected = function(chart, week) {
        chart.selectAll('.chart__bar').classed('chart__bar_selected', false);
        chart.selectAll('.chart__bar__' + week).classed('chart__bar_selected', true);
    };

    var drawBarChart = function(selections, selection, data, maxValue, topValues, bottomValues, daysValues) {
        var options = {
            width: 300,
            height: 100,
            xScaleHeight: 20,
            xScaleLineHeight: 1,
            usualWorkDays: 5
        };

        var chart = selection
            .html('')
            .append('svg')
            .attr('width', options.width)
            .attr('height', options.height + options.xScaleHeight);

        var x = d3.scaleLinear()
            .range([0, options.width])
            .domain([+data.min.week, +data.max.week + 1]);

        var y = d3.scaleLinear()
            .range([options.height, 0])
            .domain([0, maxValue(data)]);

        drawBars(chart, options, data, x, y, topValues, bottomValues, daysValues, function(week) {
            highlightWeek(selections, data, week);
        });

        var xScaleLine = chart.append('g')
            .attr('transform', 'translate(0, ' + options.height + ')');

        xScaleLine.append('text')
            .classed('chart__x-scale-date', true)
            .attr('x', 0)
            .attr('y', options.xScaleHeight)
            .text(getDayText(moment().week(data.min.week).weekday(1)));

        xScaleLine.append('text')
            .classed('chart__x-scale-date', true)
            .attr('text-anchor', 'end')
            .attr('x', options.width)
            .attr('y', options.xScaleHeight)
            .text(getDayText(moment().week(data.max.week).weekday(7)));

        chart.on('mouseout', function() {
            highlightLastWeek(selections, data);
        });

        highlightLastWeek(selections, data);
    };

    var setCounters = function(data, week) {
        d3.select('.placeholder__week-number').text(week);
        d3.select('.placeholder__week-days').text(getDaysText(week));
        d3.select('.placeholder__week-days-count').text(getDaysCountText(data.workDays[week]));

        d3.select('.placeholder__week-sales').text(data.sales[week]);
        d3.select('.placeholder__week-sales-anonymous').text(data.anonymousSales[week]);
        d3.select('.placeholder__week-guests').text(data.users[week]);

        d3.select('.placeholder__week-arps').text(data.arps[week]);
        d3.select('.placeholder__week-arpg').text(data.arpg[week]);
        d3.select('.placeholder__week-arpg-div-arps').text(Math.round(data.arpg[week] / data.arps[week] * 10) * 10);

        d3.select('.placeholder__week-penetration').text(data.penetration[week]);
        d3.select('.placeholder__week-acquisition').text(data.acquisition[week]);
        d3.select('.placeholder__week-office-population').text(data.officeWorkersCount);
        d3.select('.placeholder__week-new-guests').text(data.acquiredGuests[week]);

        d3.select('.placeholder__week-retention').text(data.retention[week]);
        d3.select('.placeholder__week-churn').text(data.churn[week]);
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

    var drawBarCharts = function(data, options) {
        var selections = [];

        options.map(function(option) {
            option.selection = d3.select(option.selector);
            selections.push(option.selection);
            return option;
        }).forEach(function(option) {
            drawBarChart(selections, option.selection, data, option.max, option.top, option.bottom, option.day);
        });
    };

    updateData = function() {
        d3.json('/data.json', function(data) {
            drawBarCharts(data, [{
                selector: '.chart__users-and-sales',
                max: function(data) { return data.max.sales; },
                top: function(data) { return data.sales; },
                bottom: function(data) { return data.users; },
                day: function(data) { return data.workDays; }
            }, {
                selector: '.chart__arpg-and-arps',
                max: function (data) { return data.max.arpg; },
                top: function (data) { return data.arpg; },
                bottom: function (data) { return data.arps; },
                day: function(data) { return data.workDays; }
            }, {
                selector: '.chart__penetration-and-acquisition',
                max: function (data) { return data.max.penetration; },
                top: function (data) { return data.penetration; },
                bottom: function (data) { return data.acquisition; },
                day: function(data) { return data.workDays; }
            }, {
                selector: '.chart__retention-and-churn',
                max: function (data) { return Math.max(data.max.churn, data.max.retention); },
                top: function (data) { return data.churn; },
                bottom: function (data) { return data.retention; },
                day: function(data) { return data.workDays; }
            }]);
        });
    };
})();
