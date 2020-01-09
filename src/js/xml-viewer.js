(function(global) {
  'use strict';

  const WHITE_CHARS_REGEX = /\S/;
  const ELEMENT_NODE = 1;
  const TEXT_NODE = 3;
  const COMMENT_NODE = 8;
  const ALT_BUTTON_CODE = 18;

  class xmlViewerPlugin {
    constructor(containerId, url, numberOfNodesToShow, searchInputId) {
      this.containerId = containerId;
      this.container = document.getElementById(this.containerId);
      this.url = url;
      this.nodeLevelCounter = 0;
      this.numberOfNodesToShow = numberOfNodesToShow;
      this.buttonIsKeyDown = false;
      this.searchInputId = searchInputId;
      this.initializeSearch();
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
      if (className) {
        element.className = className;
      }
      if (text) {
        const textSpan = document.createElement(type);
        textSpan.className = 'text';
        textSpan.appendChild(document.createTextNode(text));
        element.appendChild(textSpan);
      }
      if (id) {
        element.id = id;
      }
      return element;
    }

    checkNodeIsNotEmpty(childNodes) {
      let childNodesNumber = 0;
      childNodes.forEach(node => {
        if (!WHITE_CHARS_REGEX.test(node.textContent)) {
          return false;
        }
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
      if (childNodeIsNotEmpty) {
        tag.appendChild(this.createToggleElement());
      }
      tag.appendChild(this.prepareOpeningTag(node));
      if (node.childNodes.length) {
        const tagContent = this.createHTMLElement('span', 'tag-content');
        this.setVisibility(tagContent, this.shouldBeExpanded());
        Array.from(node.childNodes).forEach(item =>
          this.chooseSpecificNodeToPrepare(item, tagContent)
        );
        tag.appendChild(tagContent);
      }
      this.nodeLevelCounter--;
      tag.appendChild(this.prepareClosingTag(node));
      return tag;
    }

    chooseSpecificNodeToPrepare(item, tagContent) {
      let childNode;
      if (item.nodeType === ELEMENT_NODE) {
        //element node
        childNode = this.prepareNode(item);
      } else if (item.nodeType === COMMENT_NODE) {
        //comment node
        childNode = this.prepareCommentNode(item);
      } else {
        //text and other nodes
        childNode = this.prepareTextNode(item);
      }
      if (childNode) {
        tagContent.appendChild(childNode);
      }
    }

    createToggleElement() {
      const plugin = this;
      const expand = this.createHTMLElement('span', 'expand', false);
      if (this.shouldBeExpanded()) {
        expand.classList.add('expanded');
      }
      expand.appendChild(this.createHTMLElement('span', 'on', '+'));
      expand.appendChild(this.createHTMLElement('span', 'off', '-'));
      expand.onclick = function() {
        const toggleElementExpanded = this.classList.contains('expanded');
        plugin.setElementVisibility(this, !toggleElementExpanded);
        if (plugin.buttonIsKeyDown) {
          plugin.setVisibilityForChildElements(
            this.nextSibling.nextSibling,
            !toggleElementExpanded
          );
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
      element.style.display = visible ? 'block' : 'none';
    }

    prepareOpeningTag(element) {
      const tag = this.createHTMLElement('span', 'opening-tag');
      tag.appendChild(this.createHTMLElement('span', 'opening', '<'));
      tag.appendChild(
        this.createHTMLElement('span', 'tag-name', element.tagName)
      );
      if (element.attributes.length) {
        const attributes = this.createHTMLElement('span', 'attributes');
        const attributesArray = Array.from(element.attributes);
        attributesArray.forEach(item => {
          const attribute = this.createHTMLElement('span', 'attribute');
          attribute.appendChild(
            this.createHTMLElement('span', 'attribute-name', ' ' + item.name)
          );
          attribute.appendChild(
            this.createHTMLElement('span', 'attribute-equal-char', '=')
          );
          attribute.appendChild(
            this.createHTMLElement('span', 'attribute-value', `"${item.value}"`)
          );
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
      tag.appendChild(
        this.createHTMLElement('span', 'tag-name', element.tagName)
      );
      tag.appendChild(this.createHTMLElement('span', 'closing', '>'));
      this.appendNumberTag(tag);
      return tag;
    }

    prepareTextNode(node) {
      if (!WHITE_CHARS_REGEX.test(node.textContent)) {
        return false;
      }
      const tag = this.createHTMLElement(
        'span',
        'text-content',
        node.textContent
      );
      this.appendNumberTag(tag);
      return tag;
    }

    prepareCommentNode(node) {
      if (!WHITE_CHARS_REGEX.test(node.textContent)) {
        return false;
      }
      const tag = this.createHTMLElement(
        'span',
        'comment-content',
        `<!--${node.textContent}-->`
      );
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
      window.addEventListener('keydown', e => {
        if (e.keyCode === ALT_BUTTON_CODE) {
          this.buttonIsKeyDown = true;
        }
      });
      window.addEventListener('keyup', e => {
        if (e.keyCode === ALT_BUTTON_CODE) {
          this.buttonIsKeyDown = false;
        }
      });
    }

    setVisibilityForChildElements(element, visibility) {
      if (this.checkNodeIsNotEmpty(element.childNodes)) {
        Array.from(element.childNodes).forEach(item => {
          if (
            item.classList.contains('tag-nonempty') &&
            item.firstChild.nextSibling.nextSibling
          ) {
            const toggleElement = item.firstChild;
            this.setElementVisibility(toggleElement, visibility);
            this.setVisibilityForChildElements(
              toggleElement.nextSibling.nextSibling,
              visibility
            );
          }
        });
      }
    }

    initializeSearch() {
      const searchInput = document.querySelector(`#${this.searchInputId}`);
      if (searchInput) {
        searchInput.addEventListener('input', event => {
          this.clearDocumentFromSearchNodes(this.container.firstChild);
          const phrase = event.target.value.toLowerCase();
          this.searchPhrase(phrase, this.container.firstChild);
        });
      }
    }

    clearDocumentFromSearchNodes(basicNode) {
      if (!basicNode) return;
      for (let node = basicNode.firstChild; node; node = node.nextSibling) {
        if (node.nodeType === TEXT_NODE) {
          this.clearSpecificTextNode(node);
        } else {
          this.clearDocumentFromSearchNodes(node);
        }
      }
    }

    clearSpecificTextNode(node) {
      const nodeToRemoveParent = this.findAncestor(
        node,
        '.text-content, .opening-tag, .closing-tag, .comment-content'
      );
      const nodeToRemove = nodeToRemoveParent
        ? nodeToRemoveParent.querySelector('.search-phrase')
        : null;
      if (nodeToRemove) nodeToRemove.remove();
    }

    searchPhrase(text, basicNode) {
      if (!basicNode) return;
      for (let node = basicNode.firstChild; node; node = node.nextSibling) {
        if (node.nodeType === TEXT_NODE) {
          this.searchSpecificTextNode(text, node);
        } else if (
          !node.classList.contains('opening') &&
          !node.classList.contains('closing')
        ) {
          this.searchPhrase(text, node);
        }
      }
    }

    searchSpecificTextNode(text, node) {
      if (text && node.textContent.toLowerCase().includes(text)) {
        const container = this.findAncestor(
          node,
          '.text-content, .opening-tag, .closing-tag, .comment-content'
        );
        container.prepend(this.prepareSearchNode());
      }
    }

    findAncestor(el, sel) {
      while (
        (el = el.parentElement) &&
        !(el.matches || el.matchesSelector).call(el, sel)
      );
      return el;
    }

    prepareSearchNode() {
      return this.createHTMLElement('span', 'search-phrase');
    }
  }
  global.xmlViewerPlugin = xmlViewerPlugin;
})(window);
