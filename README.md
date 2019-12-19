# xml-viewer

Render and preview XML file in browser.

## Features:
- Pure JavaScript
- Ultra light
- Ultra fast
- Possibility to add custom styles
- Showing/hiding nodes
- Showing/hiding all children nodes by clicking '+'/'-' with pressed 'alt' button
- Line numbers display

## Configuration
```javascript
new xmlParserPlugin(containerId, url, numberOfNodesToShow);
```
**containerId** - id of the HTML element where XML preview should be appended

**url** - path to XML file to preview

**numberOfNodesToShow** - number of nodes that will be expanded at initialization

## Example usage
```javascript
new xmlParserPlugin('foo', 'data/example.xml', 3);
```
 ## Initialization
 ```sh
 npm start
 ```
 
 ## Build
  ```sh
 npm build
 ```
