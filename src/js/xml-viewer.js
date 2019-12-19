(function (global) {
    'use strict';

    class xmlViewerPlugin {
        constructor(containerId, url, numberOfNodesToShow) {
            this.containerId = containerId;
            this.container = document.getElementById(this.containerId);
            this.url = url;
            this.nodeLevelCounter = 0;
            this.whiteCharsRegex = /\S/;
            this.numberOfNodesToShow = numberOfNodesToShow;
            this.buttonIsKeyDown = false;
            this.load();
        }

        load() {
            var xhr = new XMLHttpRequest();
            xhr.open('get', this.url, true);
            xhr.responseType = 'document';
            xhr.overrideMimeType('text/xml');
            xhr.onload = () => {
                if (xhr.readyState === xhr.DONE && xhr.status === 200) {
                    this.prepareXml(xhr.response);
                    this.bindExpandChildNodesEvent();
                }
            };
            xhr.send();
        }

        prepareXml(xml) {
            this.nodeLevelCounter = 0;
            this.nodeGlobalCounter = 0;
            this.container.appendChild(this.prepareNode(xml.documentElement));
        }

        createHTMLElement(type, className, text, id) {
            const element = document.createElement(type);
            if(className) { element.className = className; }
            if(text) { element.appendChild(document.createTextNode(text)); }
            if(id) { element.id = id; }
            return element;
        }

        checkNodeIsNotEmpty(childNodes) {
            let childNodesNumber = 0;
            childNodes.forEach(node => {
                if (!this.whiteCharsRegex.test(node.textContent)) { return false; }
                childNodesNumber++;
            });
            return childNodesNumber > 0;
        }

        shouldBeExpanded() {
            return this.nodeLevelCounter <= this.numberOfNodesToShow;
        }

        prepareNode(node) {
            const tag = this.createHTMLElement('span', 'tag');
            const childNodeIsNotEmpty = this.checkNodeIsNotEmpty(node.childNodes);
            this.nodeLevelCounter++;
            tag.classList.add(childNodeIsNotEmpty ? 'tag-nonempty' : 'tag-empty');
            if(childNodeIsNotEmpty) { tag.appendChild(this.createToggleElement()); }
            tag.appendChild(this.prepareOpeningTag(node));
            if (node.childNodes.length) {
                const tagContent = this.createHTMLElement('span', 'tag-content');
                if(this.shouldBeExpanded()) {
                    this.setVisibility(tagContent, true);
                } else {
                    this.setVisibility(tagContent, false);
                }
                Array.from(node.childNodes).forEach(item => {
                    let childNode;
                    if(item.nodeType === 1) {
                        //element node
                        childNode = this.prepareNode(item);
                    } else if (item.nodeType === 8) {
                        //comment node
                        childNode = this.prepareCommentNode(item);
                    } else {
                        //text and other nodes
                        childNode = this.prepareTextNode(item);
                    }
                    if(childNode) { tagContent.appendChild(childNode); }
                });
                tag.appendChild(tagContent);
            }
            this.nodeLevelCounter--;
            tag.appendChild(this.prepareClosingTag(node));
            return tag;
        }

        createToggleElement() {
            const plugin = this;
            const expand = this.createHTMLElement('span', 'expand', false);
            if (this.shouldBeExpanded()) { expand.classList.add('expanded'); }
            expand.appendChild(this.createHTMLElement('span', 'on', '+'));
            expand.appendChild(this.createHTMLElement('span', 'off', '-'));
            expand.onclick = function () {
                const toggleElementExpanded = this.classList.contains('expanded');
                if (plugin.buttonIsKeyDown) {
                    plugin.setElementVisibility(this, !toggleElementExpanded);
                    plugin.setVisibilityForChildElements(this.nextSibling.nextSibling, !toggleElementExpanded);
                } else {
                    plugin.setElementVisibility(this, !toggleElementExpanded);
                }
            };
            return expand;
        }

        setElementVisibility(element, visibility) {
            if (visibility) {
                if (!element.classList.contains('expanded')) {
                    element.classList.add('expanded');
                    this.setVisibility(element.nextSibling.nextSibling, true);
                }
            } else {
                element.classList.remove('expanded');
                this.setVisibility(element.nextSibling.nextSibling, false);
            }
        }

        setVisibility(element, visible) {
            element.style.display = (visible) ? 'block' : 'none';
        }

        prepareOpeningTag(element) {
            const tag = this.createHTMLElement('span', 'opening-tag');
            tag.appendChild(this.createHTMLElement('span', 'opening', '<'));
            tag.appendChild(this.createHTMLElement('span', 'tag-name', element.tagName));
            if (element.attributes.length) {
                const attributes = this.createHTMLElement('span', 'attributes');
                const attributesArray = Array.from(element.attributes);
                attributesArray.forEach(item => {
                    const attribute = this.createHTMLElement('span', 'attribute');
                    attribute.appendChild(this.createHTMLElement('span', 'attribute-name', ' ' + item.name));
                    attribute.appendChild(this.createHTMLElement('span', 'attribute-equal-char', '='));
                    attribute.appendChild(this.createHTMLElement('span', 'attribute-value', `"${item.value}"`));
                    attributes.appendChild(attribute);
                });
                tag.appendChild(attributes);
            }
            tag.appendChild(this.createHTMLElement('span', 'closing', '>'));
            this.appendNumberTag(tag);
            return tag;
        }

        prepareClosingTag(element) {
            const tag = this.createHTMLElement('span', 'closing-tag');
            tag.appendChild(this.createHTMLElement('span', 'opening', '</'));
            tag.appendChild(this.createHTMLElement('span', 'tag-name', element.tagName));
            tag.appendChild(this.createHTMLElement('span', 'closing', '>'));
            this.appendNumberTag(tag);
            return tag;
        }

        prepareTextNode(node) {
            if (!this.whiteCharsRegex.test(node.textContent)) { return false; }
            const tag = this.createHTMLElement('span', 'text-content', node.textContent);
            this.appendNumberTag(tag);
            return tag;
        }

        prepareCommentNode(node) {
            if (!this.whiteCharsRegex.test(node.textContent)) { return false; }
            const tag = this.createHTMLElement('span', 'comment-content', `<!--${node.textContent}-->`);
            this.appendNumberTag(tag);
            return tag;
        }

        prepareNumberTag(number) {
            return this.createHTMLElement('span', 'line-number', number);
        }

        appendNumberTag(container) {
            this.nodeGlobalCounter++;
            container.prepend(this.prepareNumberTag(this.nodeGlobalCounter));
        }

        bindExpandChildNodesEvent() {
            window.addEventListener('keydown', (e) => { if (e.keyCode === 18) { this.buttonIsKeyDown = true; }} );
            window.addEventListener('keyup', (e) => { if (e.keyCode === 18) { this.buttonIsKeyDown = false; } });
        }

        setVisibilityForChildElements(element, visibility) {
            if (this.checkNodeIsNotEmpty(element.childNodes)) {
                Array.from(element.childNodes).forEach(item => {
                    if (item.classList.contains('tag-nonempty') && item.firstChild.nextSibling.nextSibling) {
                        const toggleElement = item.firstChild;
                        this.setElementVisibility(toggleElement, visibility);
                        this.setVisibilityForChildElements(toggleElement.nextSibling.nextSibling, visibility);
                    }
                });
            }
        }

    }

    global.xmlViewerPlugin = xmlViewerPlugin;

}(window));