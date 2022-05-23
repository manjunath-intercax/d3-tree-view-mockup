import React, { useState, useEffect, useCallback } from 'react';
import Tree from 'react-d3-tree';
import { Octokit } from '@octokit/core';
import { useCenteredTree } from './helpers';

const octokit = new Octokit({
  auth: ''
})

const containerStyles = {
  width: "100vw",
  height: "100vh"
};

// Here we're using `renderCustomNodeElement` render a component that uses
// both SVG and HTML tags side-by-side.
// This is made possible by `foreignObject`, which wraps the HTML tags to
// allow for them to be injected into the SVG namespace.
const renderForeignObjectNode = ({
  nodeDatum,
  toggleNode,
  foreignObjectProps
}) => (
  <g>
    <circle r={15}></circle>
    {/* `foreignObject` requires width & height to be explicitly set. */}
    <foreignObject {...foreignObjectProps}>
      <div style={{ border: "1px solid black", backgroundColor: "#dedede" }}>
        <h3 style={{ textAlign: "center" }}>{nodeDatum.name}</h3>
        {nodeDatum.children && (
          <button style={{ width: "100%" }} onClick={toggleNode}>
            {nodeDatum.__rd3t.collapsed ? "Expand" : "Collapse"}
          </button>
        )}
      </div>
    </foreignObject>
  </g>
);

export default function OrgChartTree() {
  const [treeData, setTreeData] = useState(undefined)
  const [translate, containerRef] = useCenteredTree();
  const nodeSize = { x: 125, y: 100 };
  const foreignObjectProps = { width: nodeSize.x, height: nodeSize.y, x: 20 };
  useEffect(() => {
    fetchTreeData();
  }, [])

  const fetchTreeData = async () => {
    let username = 'manjunath-intercax'
    let treeData = {
      name: 'User Repository',
      attributes: {
        "department": "Repository"
      },
      children: []
    };
    const repositoriesResponse = await octokit.request('GET /users/{username}/repos', {
      username
    })
    if (repositoriesResponse?.data?.length) {
      for (let repositoryIndex = 0; repositoryIndex < repositoriesResponse?.data?.length; repositoryIndex++) {
        const repository = repositoriesResponse?.data[repositoryIndex];
        const pullRequestsResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
          owner: username,
          attributes: {
            "department": "Pull Requests"
          },
          repo: repository?.name
        })
        let pullRequestData = [];
        if (pullRequestsResponse?.data?.length) {
          for (let pullRequestIndex = 0; pullRequestIndex < pullRequestsResponse?.data.length; pullRequestIndex++) {
            const pullRequest = pullRequestsResponse?.data[pullRequestIndex];
            const pullRequestFilesResponse = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}/files', {
              owner: username,
              repo: 'tree-mockup',
              pull_number: pullRequest?.number
            })
            let files = pullRequestFilesResponse?.data.map(fileItem => {
              let fileName = fileItem?.filename?.split('/');
              return ({
                ...fileItem, name: fileName[fileName.length - 1]
              })
            })
            pullRequestData.push({
              name: pullRequest?.title,
              attributes: {
                "department": "File Name"
              },
              ...pullRequest,
              children: files,
              files: pullRequestFilesResponse?.data
            })
          }

        }
        treeData.children.push({
          ...repository,
          name: repository.name,
          children: pullRequestData
        })
      }
    }
    // The value we return becomes the `fulfilled` action payload
    setTreeData(treeData);
  }

  const getDynamicPathClass = ({ source, target }, orientation) => {
    if (!target.children) {
      // Target node has no children -> this link leads to a leaf node.
      return 'link__to-leaf';
    }

    // Style it as a link connecting two branch nodes by default.
    return 'link__to-branch';
  };

  return (
    // `<Tree />` will fill width/height of its container; in this case `#treeWrapper`.
    <div id="treeWrapper" style={containerStyles} ref={containerRef}>
      {treeData && treeData?.children && treeData?.children.length > 0 &&
        <Tree
          renderCustomNodeElement={(rd3tProps) =>
            renderForeignObjectNode({ ...rd3tProps, foreignObjectProps })
          }
          translate={translate}
          // nodeSize
          orientation='verticle'
          rootNodeClassName="node__root"
          branchNodeClassName="node__branch"
          leafNodeClassName="node__leaf"
          pathClassFunc={getDynamicPathClass}
          data={treeData} />}
    </div>
  );
}