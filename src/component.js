/*
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import ResizeObserver from 'resize-observer-polyfill';
import ModelView from './views/ModelView.js';
import ARKitSVG from './assets/arkit-glyph.svg';
import { openIOSARQuickLook, getModelSource, getUSDZSource } from './utils.js';

const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }
    .container {
      position: relative;
    }
    a.enter-ar {
      width: 75px;
      height: 75px;
      position: absolute;
      display: block;
      right: 20px;
      top: 20px;
      display: none;
    }
    a.enter-ar svg {
      position: absolute;
      top: 0;
      left: 0;
    }
    a.enter-ar .disc {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      opacity: 0.6;
      background-color: #fff;
      box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.2);
      position: absolute;
      top: 0;
      left: 0;
    }
    canvas {
      width: 100%;
      height: 100%;
    }
  </style>
  <div class="container">
    <a class="enter-ar" href="#">
      <div class="disc"></div>
      ${ARKitSVG}
    </a>
    <canvas></canvas>
  </div>
  <slot></slot>
`;

/**
 * Definition for a <arview> component.
 *
 */
export default class ModelViewComponent extends HTMLElement {

  static get observedAttributes() {
    return [
    ];
  }

  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(template.content.cloneNode(true));


    // Create the underlying ModelView app.
    const { width, height } = this.getBoundingClientRect();
    this.modelView = new ModelView({
      canvas: shadowRoot.querySelector('canvas'),
      width,
      height,
    });

    
    const enterARButton = shadowRoot.querySelector('.enter-ar');
    
    enterARButton.addEventListener('click', e => {
      e.preventDefault();
      this.enterAR()
    });

    if (IS_IOS || this.modelView.hasAR()) {
      enterARButton.style.display = 'block';
    }

    // Observe changes in this element, mainly for new <source> children,
    // or <source> changes. Update underlying ModelView if a new source
    // file becomes valid.
    this.mutationObserver = new MutationObserver(() => {
      this.modelView.setModelSource(getModelSource(this));
    });
    this.mutationObserver.observe(this, {
      childList: true,
      attributes: true,
      subtree: true,
    });
    // Update the sources on construction
    this.modelView.setModelSource(getModelSource(this));

    // Set a resize observer so we can scale our canvas
    // if our <xr-model> changes
    this.resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.target === this) {
          this.modelView.setSize(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });
    this.resizeObserver.observe(this);

  }

  enterAR() {
    const usdzSource = getUSDZSource(this);
    if (IS_IOS && usdzSource) {
      openIOSARQuickLook(usdzSource);
    } else {
      this.modelView.enterAR();
    }
  }

  connectedCallback() {
    console.log("CONNECTED");
  }

  disconnectedCallback() {
    console.log("DISCONNECTED");
  }

  attributeChangedCallback(name, oldVal, newVal, namespace) {
    /*
    switch (name) {
      case 'src':
        this.src = newVal;
        break;
      case 'env-map':
        this['env-map'] = newVal;
        break;
      case 'env-map-intensity':
        this['env-map-intensity'] = newVal;
        break;
      case 'bloom-blur-amount':
        this['bloom-blur-amount'] = newVal;
        break;
    }

    this.modelView.updateValue(name, newVal);
    */
  }

  /**
   * Custom element has been moved into a new document.
   */
  adoptedCallback(oldDoc, newDoc) {
    throw new Error('not supported');
  }
}
