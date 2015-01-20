#! /bin/bash
if [ -z "$1" ]
  then
  echo "You must supply tasks with an argument. One of (build, dist:clean, dist:create, watch)"
else
  case "$1" in
    build)
      echo 'Compiling ES6'
      6to5 src/store.js -o dist/store.js
      ;;

    dist:clean)
      echo 'Cleaning'
      rm -rf dist
      ;;

    dist:create)
      echo 'Creating dist dir..'
      mkdir dist
      ;;

    watch)
      echo 'Watching for changes'
      6to5 src/store.js -o dist/store.js --source-maps --watch
      ;;
  esac
fi
