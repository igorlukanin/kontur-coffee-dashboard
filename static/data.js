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

    var drawBars = function(chart, options, data, xScale, yScale, hoverHandler) {
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
                .attr('y', function(d) { return yScale(data.sales[week]); })
                .attr('height', function(d) { return options.height - yScale(data.sales[week]); })
                .attr('width', barWidth);

            bar.append('rect')
                .classed('chart__bar_guests', true)
                .attr('y', function(d) { return yScale(data.users[week]); })
                .attr('height', function(d) { return options.height - yScale(data.users[week]); })
                .attr('width', barWidth);
        });
    };

    var setBarSelected = function(chart, week) {
        chart.selectAll('.chart__bar').classed('chart__bar_selected', false);
        chart.selectAll('.chart__bar__' + week).classed('chart__bar_selected', true);
    };

    var drawUsersAndSalesGraph = function(selector, data) {
        var options = {
            width: 300,
            height: 150,
            xScaleHeight: 20,
            xScaleLineHeight: 1
        };

        var chart = d3.select(selector)
            .append('svg')
            .attr('width', options.width)
            .attr('height', options.height + options.xScaleHeight);

        var x = d3.scaleLinear()
            .range([0, options.width])
            .domain([+data.min.week, +data.max.week + 1]);

        var y = d3.scaleLinear()
            .range([options.height, 0])
            .domain([0, data.max.sales]);

        drawBars(chart, options, data, x, y, function(week) {
            highlightWeek(chart, data, week);
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
            highlightLastWeek(chart, data);
        });

        highlightLastWeek(chart, data);
    };

    var setCounters = function(data, week) {
        d3.select('.placeholder__week-number').text(week);
        d3.select('.placeholder__week-days').text(getDaysText(week));

        d3.select('.placeholder__week-sales').text(data.sales[week]);
        d3.select('.placeholder__week-sales-anonymous').text(data.anonymousSales[week]);
        d3.select('.placeholder__week-guests').text(data.users[week]);

        d3.select('.placeholder__week-arps').text('—'); // TODO: Change
        d3.select('.placeholder__week-arpg').text('—'); // TODO: Change
    };

    var highlightWeek = function(chart, data, week) {
        setCounters(data, week);
        setBarSelected(chart, week);
    };

    var highlightLastWeek = function(chart, data) {
        var week = data.weeks[data.weeks.length - 1];
        highlightWeek(chart, data, week);
    };

    d3.json('/data/sales-and-guests.json', function(data) {
        drawUsersAndSalesGraph('.chart__users-and-sales', data);
    });
})();