# IndexedDB plugin for Eruda ![CI](https://github.com/NoelDeMartin/eruda-indexeddb/actions/workflows/ci.yml/badge.svg)

This plugin adds IndexedDB support for [Eruda](https://eruda.liriliri.io/).

## Installation

In the command line...

```sh
npm install eruda-indexeddb
```

In your code...

```js
import erudaIndexedDB from 'eruda-indexeddb';
import eruda from 'eruda';

eruda.init();
eruda.add(erudaIndexedDB);
```

And you're done!
