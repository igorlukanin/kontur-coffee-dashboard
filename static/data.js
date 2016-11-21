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

    var drawBars = function(chart, options, keys, data, xScale, yScale, classModifier) {
        var barWidth = xScale(keys[1]) - xScale(keys[0]);

        keys.forEach(i => {

            var bar = chart.append('g')
                .attr('transform', 'translate(' + xScale(i) + ', 0)');

            bar.append('rect')
                .classed('chart__bar', true)
                .classed('chart__bar_' + classModifier, true)
                .attr('y', function(d) { return yScale(data[i]); })
                .attr('height', function(d) { return options.height - yScale(data[i]); })
                .attr('width', barWidth);

            bar.append('rect')
                .classed('chart__bar__top', true)
                .classed('chart__bar__top_' + classModifier, true)
                .attr('y', function(d) { return yScale(data[i]); })
                .attr('height', options.topLineHeight)
                .attr('width', barWidth);
        });
    };

    var drawUsersAndSalesGraph = function(selector, data) {
        var options = {
            width: 300,
            height: 150,
            xScaleHeight: 20,
            xScaleLineHeight: 1,
            topLineHeight: 1
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

        drawBars(chart, options, data.weeks, data.sales, x, y, 'sales');
        drawBars(chart, options, data.weeks, data.users, x, y, 'guests');

        var xScaleLine = chart.append('g')
            .attr('transform', 'translate(0, ' + options.height + ')');

        xScaleLine.append('rect')
            .classed('chart__x-scale-line', true)
            .attr('y', 0)
            .attr('height', options.xScaleLineHeight)
            .attr('width', options.width);

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

    d3.json('/data/sales-and-guests.json', function(data) {
        var week = data.weeks[data.weeks.length - 1];

        setCounters(data, week);
        drawUsersAndSalesGraph('.chart__users-and-sales', data);
    });
})();