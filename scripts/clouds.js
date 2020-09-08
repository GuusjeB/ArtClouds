// Globals
var artists = [];
var search_input;
var circle_extent;
var padding;
var circle_radius;
var cloud;
var clouds = [];
var dominant_colors;
var complementary_color;
var zoomed_on_circle = false;
var zoomed_on_picture = false;
var meanYear;
var id;
var previous_circle_viewbox;

const reference_canvas_width = 20000,
      reference_canvas_height = 20000;

const svg_width = 1500,
      svg_height = 1500;

// Create SVG container
var svg = d3.select("#art-cloud")
      .append("svg")
      .attr("height", svg_height)
      .attr("width", svg_width)
      .attr("viewBox", 0 + ' ' + 0 + ' ' + svg_width + ' ' + svg_width);

// Define the div for the tooltip
let tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

// Autocomplete function for search bar
d3.csv("csv/artist_names.csv").then(function(data) {
    var artist_last_names = d3.map(data, function(d){return toTitleCase(d.artist_last_name); }).keys();
    autocomplete(document.getElementById("myVal"), artist_last_names);
});

// Push search value to function create_cloud
function handleClick(event){
    create_cloud(document.getElementById("myVal").value);
    return false;
};

// Function to capitalize first letters of each word
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

// Link information in side bar to data points of clicked picture
function showSidebar(dataPoint) {
    var button_string = '<button type="button" onclick="window.open(\'';
    // console.log(button_string)
    button_string = button_string + dataPoint['image_url'];
    // console.log(button_string)
    button_string = button_string + '\')>Image</button> ';
    // console.log(button_string)

    var rightColumn = d3.select('#rightcolumn');
    console.log(dataPoint);
    rightColumn.select('#title').select('.content').html(toTitleCase(dataPoint['artwork_name']));
    rightColumn.select('#dimensions').select('.content').html(dataPoint['dimensions']);
    rightColumn.select('#artist_full_name').select('.content').html(toTitleCase(dataPoint['artist_full_name']));
    rightColumn.select('#date').select('.content').html(dataPoint['date']);
    rightColumn.select('#collection_origins').select('.content').html(dataPoint['collection_origins']);
    rightColumn.select('#media').select('.content').html(dataPoint['media']);
    rightColumn.select('#palette_families').select('.content').html(dataPoint['palette_families']);
    rightColumn.select('#descripton').select('.content').html(dataPoint['description']);
    rightColumn.select('#inspect').select('.content').attr('action', dataPoint['image_url']);
}

// Force Layout
var multiplier = 10;
var forceCollide = d3.forceCollide(function(d){ return d.circle_radius; })
var forceXCombine = d3.forceX(svg_width/4).strength(.01 * multiplier)

var forceXYear45 = d3.forceX(function(d) {
  if ( d.meanYear <= 1945) {
      return 5
    } else {
      return 900
    }
  }
).strength(.01 * multiplier);

var forceXYear1900 = d3.forceX(function(d) {
  if ( d.meanYear <= 1900) {
      return 5
    } else {
      return 900
    }
  }
).strength(.01 * multiplier);

var simulation = d3.forceSimulation()
          .force("forceX", forceXCombine)
          .force("forceY", d3.forceY(svg_height/12).strength(.01 * multiplier))
          .force("charge", d3.forceManyBody().strength(5 * multiplier))
          .force("collide", forceCollide);

function ticked() {
    svg.selectAll("g.cloud")
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
};

// Cluster button combine
d3.select('#combine').on('click', function() {
    var activeClass = 'nav-item nav-link active'
    var notActiveClass = 'nav-item nav-link';
    d3.select('#yearCluster45')
        .classed(activeClass, false)
        .classed(notActiveClass, true);
    d3.select('#yearCluster1900')
        .classed(activeClass, false)
        .classed(notActiveClass, true);
    d3.select(this).classed(activeClass, true)
    simulation
    .force("forceX", forceXCombine)
    .alphaTarget(0.1)
    .restart()
});

// Cluster button 1945
d3.select('#yearCluster45').on('click', function() {
    var activeClass = 'nav-item nav-link active'
    var notActiveClass = 'nav-item nav-link';
    d3.select('#combine')
        .classed(activeClass, false)
        .classed(notActiveClass, true);
    d3.select('#yearCluster1900')
        .classed(activeClass, false)
        .classed(notActiveClass, true);
    d3.select(this).classed(activeClass, true)
    simulation
    .force("forceX", forceXYear45)
    .alphaTarget(0.1)
    .restart()
});

// Cluster buttons 1900
d3.select('#yearCluster1900').on('click', function() {
    var activeClass = 'nav-item nav-link active'
    var notActiveClass = 'nav-item nav-link';
    d3.select('#combine')
        .classed(activeClass, false)
        .classed(notActiveClass, true);
    d3.select('#yearCluster45')
        .classed(activeClass, false)
        .classed(notActiveClass, true);
    d3.select(this).classed(activeClass, true)
    simulation
    .force("forceX", forceXYear1900)
    .alphaTarget(0.1)
    .restart()
});

// Drag functions
function dragstarted(d) {
    if (!d3.event.active && !zoomed_on_circle) simulation.alphaTarget(.03).restart();
    d.fx = d.x;
    d.fy = d.y;
}

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}

function dragended(d) {
    if (!d3.event.active) simulation.alphaTarget(.03);
    d.fx = null;
    d.fy = null;
}

// Zoom function (double click)
function zoomOnCircle(g_elem) {

    var circle = d3.select(g_elem).select('circle');
    var radius = circle.attr("r");
    var top  = $(circle.node()).offset()['top'];
    var left = $(circle.node()).offset()['left'];

    if (!zoomed_on_circle) {
        svg.transition()
            .duration(1000)
            .attr("viewBox", (left-radius) + ' ' + (top-radius) + ' ' + (radius*5) + ' ' + radius*5);

        simulation.stop();
        zoomed_on_circle = true;
    }
    else {
        svg.transition()
            .duration(1000)
            .attr("viewBox", 0 + ' ' + 0 + ' ' + svg_width + ' ' + svg_width);
        zoomed_on_circle = false;
        simulation.restart();
    }
}

// Remove cloud function (shift + click)
function removeCloud(id) {
  if (d3.event.shiftKey) {
      for (var i = 0; i < clouds.length; i++) {
        if (clouds[i].id == id){
          clouds.splice(i, 1);
        }
      }
      console.log(clouds);

      $(".tooltip").hide();
      d3.selectAll('#'+id).remove();
      simulation.restart();
  }
}

// Create cloud based on search
function create_cloud(searchValue) {

    artists.push(searchValue);
    search_input = artists.slice(-1)[0];

    // Load data for the artist that is queried
    d3.csv("csv/" + search_input + ".csv").then(function(data) {
        data.forEach(function(d) {
            d.picture = d.omni_id;
            d.x =  (+d.x * (svg_width/reference_canvas_width))/2;
            d.y = (+d.y * (svg_height/reference_canvas_height))/2;
            d.height = (+d.height * (svg_height/reference_canvas_height))/2;
            d.width = (+d.width * (svg_width/reference_canvas_width))/2;
            d.surface_area = +d.height * +d.width;
        });

        var largest_artwork = d3.max(data, function(d){ return d.surface_area})

        // Get dominant colors of the largest artwork of artist
        dominant_colors = data
            .filter(function(d){
              return d.surface_area == largest_artwork;
            })
            .map(function(d){
              return d.dominant_color;
            })

        // Get complementary color of the first dominant color
        complementary_color = invertColor(dominant_colors[0])

        // Set circle extent values of the cloud based on min and max of x and y coordinates
        circle_extent = {
            left:   d3.min(data, function(d) { return d.x - (d.width/2);}),
            right:  d3.max(data, function(d) { return d.x + (d.width/2);}),
            top:    d3.min(data, function(d) { return d.y - (d.height/2);}),
            bottom: d3.max(data, function(d) { return d.y + (d.height/2);})
        };
        var circle_domain_x = circle_extent.right - circle_extent.left;
        var circle_domain_y = circle_extent.bottom - circle_extent.top;
        var max_circle_domain = Math.max(circle_domain_x, circle_domain_y);

        // Add padding around picture cloud
        padding = (max_circle_domain/2) * 0.1;

        // Define radius for each circle
        circle_radius = (max_circle_domain/2) + padding;

        // Draw cloud
        draw(data);

        // Start force simulation
        simulation.nodes(clouds).on("tick", ticked);
    });
};

// Draw a picture cloud
function draw(data) {

    // Create id for each cloud
    var creation=Date.now();
    id = 'g_' + creation;

    cloud = svg.append("g")
               .attr("class", "cloud")
               .attr('transform', function() {return 'translate(' + [svg_width/2, svg_height/2] + ')'})
               .each(function (d) {
                  meanYear = d3.mean(data, function(d) { return d['date']; })
                  console.log("This circle has mean year: " + meanYear);
               });

    cloud.append("circle")
            .attr('class', 'circle')
            .attr("r", function(d){ return circle_radius; })
            .attr('transform', function(d) {
              return 'translate(' + [((circle_extent.right - circle_extent.left)/2) + circle_extent.left, ((circle_extent.bottom - circle_extent.top)/2) + circle_extent.top] + ')';
            });

    cloud.selectAll(".pictures")
          .data(data)
            .enter().append('image')
            .on("click", d => showSidebar(d))
            .attr('class', 'picture')
            .attr('id', 'picture')
            // .attr("href", d => 'D:\Artificial_Intelligence\Information_Visualization\Project\Viz_Project\Viz_Project\d3_demo\images/' + d.picture + '.jpg')  // 'images'/ D:\Artificial_Intelligence\Information_Visualization\Project\Viz_Project\Viz_Project\d3_demo\images
            .attr("href", d => 'D:\\Artificial_Intelligence\\CodeProjects\\InformationVisualisation\\VizTeam25-master/' + d.picture + '.jpg')  // 'images'/ D:\Artificial_Intelligence\Information_Visualization\Project\Viz_Project\Viz_Project\d3_demo\images
            .on("error", function() {
                d3.select(this).style("visibility", "hidden");
            })
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr('transform', function(d) {
                return 'translate(' + [d.x-d.width/2, d.y-d.height/2] + ')';
            });

    clouds.push({
            cloud: cloud,
            circle_radius: circle_radius,
            artist_last_name: data[0]['artist_last_name'],
            dominant_color: dominant_colors[0],
            complementary_color: complementary_color,
            meanYear: meanYear,
            id: id
    });
    console.log(artists);
    console.log(clouds);

    svg.selectAll("g").data(clouds)
            .attr('id',function(d) {return d.id})
            .on('click', function(d) {removeCloud(d.id)})
            .on("dblclick", function() {zoomOnCircle(this)})
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .on("mouseover", function(d) {
                 d3.select(this).attr("stroke", d.dominant_color).attr("stroke-width", 8);
                 $(".tooltip").show();
                 tooltip.transition()
                        .duration(200)
                        .style("opacity", .9);
                 tooltip.html(toTitleCase(d.artist_last_name))
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");})
            .on("mouseout", function(d) {
                 d3.select(this).attr("stroke", null);
                 tooltip.transition()
                        .duration(500)
                        .style("opacity", 0); });

    simulation.alphaTarget(0.1)
    simulation.restart();
};

// Functions to get the complementary color
function invertColor(hex) {
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }
    // convert 3-digit hex to 6-digits.
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) {
        throw new Error('Invalid HEX color.');
    }
    // invert color components
    var r = (255 - parseInt(hex.slice(0, 2), 16)).toString(16),
        g = (255 - parseInt(hex.slice(2, 4), 16)).toString(16),
        b = (255 - parseInt(hex.slice(4, 6), 16)).toString(16);
    // pad each with zeros and return
    return '#' + padZero(r) + padZero(g) + padZero(b);
}

function padZero(str, len) {
    len = len || 2;
    var zeros = new Array(len).join('0');
    return (zeros + str).slice(-len);
}
