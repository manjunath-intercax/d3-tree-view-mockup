import * as d3 from "d3";
import React from "react";
import ReactDOM from "react-dom"

let d3Tree = {};
d3Tree.create = function (el, props, state) {
    let svg = d3.select(el).append('svg')
        .attr('width', props.width)
        .attr('height', props.height);

    this.width = props.width;
    this.height = props.height;

    this.update(el, state);
};

d3Tree.update = function (el, state) {
    this._drawTree(el, state.data);
};

d3Tree._drawTree = function (el, data) {
    let tree = d3.tree().size([500, 250]);
    let svg = d3.select(el).select('svg');
    let nodes = tree.nodes(data);
    let g = svg.selectAll('g.node');
    let node = g.data(nodes);
    node.enter().append('svg:g')
        .attr('class', 'node')
        .attr('transform', (d) => {
            return `translate(${d.x},${d.y + 10})`;
        })
        .append("svg:circle")
        .attr("r", 6);

    node.transition().attr('transform', (d) => `translate(${d.x},${d.y})`);

    node.exit().remove();

    let p = svg.selectAll('path.link');
    let link = p.data(tree.links(nodes));
    link.enter().insert("svg:path", "g")
        .attr('class', 'link')
        .attr('d', d3.svg.diagonal().projection(function (d) {
            return [d.x, d.y];
        }));

    link.transition().attr('d', d3.svg.diagonal().projection(function (d) {
        return [d.x, d.y];
    }))

    link.exit().remove();
};

class TreeMockupD3Chart extends React.Component {
    state = {
        data: [
            {"children": [{
                "children": [{}, {}]
            }, {
                "children": [{}, {}, {}]
            }, {
                "children": [{
                    "children": [{}, {}]
                }]
            }]}
        ]
    }

    componentDidMount() {
        var el = ReactDOM.findDOMNode(this);
        d3Tree.create(el, {
            width: '100%',
            height: '300px'
        }, this.getChartState());
    }

    componentDidUpdate() {
        var el = ReactDOM.findDOMNode(this);
        d3Tree.update(el, this.getChartState());
    }

    getChartState() {
        return {
            data: {
                "children": [{
                    "children": [{}, {}]
                }, {
                    "children": [{}, {}, {}]
                }, {
                    "children": [{
                        "children": [{}, {}]
                    }]
                }]
            }
        };
    }

    render() {
        return (
            <div className="TreeChart"></div>
        );
    }
}

export default TreeMockupD3Chart;