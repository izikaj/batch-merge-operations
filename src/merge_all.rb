require 'byebug'
require_relative './api'
require_relative './merger'

Merger.new.config_file!.all!
