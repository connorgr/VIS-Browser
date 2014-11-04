function barChart(params) {
  var params = params || {};

  var color = params.color,
      height = 300,
      margin = {top: 30, right: 20, bottom: 30, left: 40},
      renderWidth = 1500,
      width = 400,
      paperHeight = params.paperHeight || 20,
      title = params.title || '';

  var conferences = params.conferences || [
    'InfoVis','SciVis','VAST','B','L','V','VIS'
  ];

  var fullData = [];

  function chart(selection) {
    selection.each(function(data) {
      data = data.sort(function(a,b) {
        // Sort by alphabetical order if the number of papers is same
        if (a.papers.length == b.papers.length) {
          var aAuthor = a.author.split(' '),
              bAuthor = b.author.split(' ');

          aAuthor = aAuthor[aAuthor.length - 1];
          bAuthor = bAuthor[bAuthor.length - 1];

          return aAuthor < bAuthor ? -1 : 1;
        }
        var cmp = a.papers.length < b.papers.length ? 1 : -1;
        return cmp;
      });

      data = data.filter(function(d) {
        return d.author != '';
      });

      var authors = data.map(function(d) { return d.author; }),
          authorPaperCount = {},
          maxPapers = d3.max(data, function(d) { return d.papers.length; });

      if(authors.indexOf('') > -1) authors.splice(authors.indexOf(''), 1);

      data.forEach(function(d) {
        authorPaperCount[d.author] = d.papers.length;
      });

      // Adjust vis height based on number of papers
      height = paperHeight * maxPapers;
      if(height < 100) height = 100;

      renderWidth = authors.length*7;

      var svg = d3.select(this).selectAll('svg')
          .data([data])
          .enter()
          .append('svg')
              .attr('height', height + margin.bottom + margin.top)
              .attr('width', width + margin.left + margin.right)
            .append('g')
              .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      var mouseOverDiv = d3.select('#chartInfoArea'),
          mouseOverAuthor = mouseOverDiv.select('p#author').text('Mouse over bar for more information (or pan/zoom)'),
          mouseOverPapers = mouseOverDiv.select('tbody#papers');

      svg.append('rect')
          .attr('x',0).attr('y',0).attr('width',width).attr('height',height)
          .style('cursor', 'move')
          .style('fill','white');

      var x = d3.scale.ordinal()
              .domain(authors)
              .rangeRoundBands([0, renderWidth], 0),
          y = d3.scale.linear()
              .domain([0, maxPapers])
              .rangeRound([height, 0]);

      var xAxis = d3.svg.axis().scale(x).orient('bottom'),
          yAxis = d3.svg.axis().scale(y).orient('left').ticks(maxPapers);

      var authorG = svg.append('g'),
          author = authorG.selectAll('.author')
              .data(data)
              .enter()
              .append('g')
                  .attr('class', 'author')
                  .attr('transform', function(d) { if(x(d.author) == undefined) { console.log(d.author);} return 'translate('+ x(d.author) + ',0)'; });

      var bars = author.selectAll('rect')
          .data(function(d) { return d.papers.map(function(a,ai) { a.ai = ai; return a; }); })
        .enter().append('rect')
          .attr('width', x.rangeBand())
          .attr('y', function(d) { return y(d.ai) - (y(1)-y(2)) })
          .attr('height', function(d) { return y(1) - y(2); })
          .style('fill', function(d) { return color(d['Conf.']); });

      author.on('mouseover', function(d) {
          author.style('opacity', .25);
          d3.select(this).style('opacity', 1);
          mouseOverAuthor.text(d.author);
          mouseOverPapers.selectAll('tr').remove();
          mouseOverPapers.selectAll('tr')
              .data(d.papers)
              .enter()
              .append('tr')
              .each(function(paper) {
                var thisEl = d3.select(this),
                    paperIndex = paper.i;

                var str = paper.Topic;
                if(paper.i < fullData.length) {
                  names = fullData[paper.i].Name.reduce(function(last,cur,i,array) {
                    if(i == 0) return cur;
                    return last+', ' + cur;
                  });
                  str = str + '<br />' + names;
                }

                thisEl.append('td').text(paper['Conf.']);
                thisEl.append('td').html(str);
              });
          })
          .on('mouseout', function(d) {
            author.style('opacity', 1);
            mouseOverAuthor.text('Mouse over bar for more information (or pan/zoom)');
            mouseOverPapers.selectAll('tr').remove();
          });

      var linesG = svg.append('g'),
          lines = linesG.selectAll('line')
              .data(data)
              .enter()
              .append('line')
                  .attr('x1', function(d) { return x(d.author); })
                  .attr('x2', function(d) { return x(d.author); })
                  .attr('y1', function(d) { return y(d.papers.length); })
                  .attr('y2', y(0))
                  .style('stroke', '#fff')
                  .style('stroke-width', 1);

      svg.append("g")
          .attr("class", "y axis")
          .call(yAxis)
        .append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", -35)
          .attr('x', -height/2)
          .attr("dy", ".71em")
          .style("text-anchor", "middle")
          .text("Numer of Papers");

      var zoom = d3.behavior.zoom()
          .scaleExtent([.5,2])
          .on('zoom', zoomed);

      svg.call(zoom);

      function zoomed() {
        var t = d3.event.translate,
            s = d3.event.scale;
        t[0] = Math.min(0, t[0]);
        zoom.translate(t);

        var change = 'translate(' + d3.event.translate[0] + ',0)scale(' + s + ',1)';
        authorG.attr('transform', change);
        linesG.attr('transform', change);
      }

      svg.append('text').text(title)
          .attr('class', 'chartTitle')
          .attr('text-anchor', 'end')
          .attr('x', width)
          .attr('y', 0);

    }); // end selection.each()
  } // end chart()

  chart.addFullData = function(data) {
    fullData = data;
    return chart;
  }

  return chart;
}