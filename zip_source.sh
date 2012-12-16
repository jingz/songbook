#!/bin/bash
find . | grep -v 'git' | zip source -@
