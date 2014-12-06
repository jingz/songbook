#!/bin/bash
find . | grep -v 'git' | grep -v 'zip' | zip source -@
