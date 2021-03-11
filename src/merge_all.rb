require 'byebug'
require_relative './api'
require_relative './merger'

Merger.new.all!
