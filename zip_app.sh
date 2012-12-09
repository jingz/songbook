#!/bin/bash
ls | grep '^[^\.]' | zip source -@
