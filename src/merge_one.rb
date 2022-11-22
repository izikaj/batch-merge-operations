# frozen_string_literal: true

require 'byebug'
require_relative './api'
require_relative './merger'

(root, src, *dsts) = ARGV || []

puts "ROOT #{root}"
puts "SRC #{src}"
puts "DSTS #{dsts.inspect}"

git_conf = File.join(root, '.git/config')
raw = File.read(git_conf) if File.exist?(git_conf)

# git remote -v
prefixes = [
  'git@bitbucket.org:',
  'ssh://git@bitbucket.org/'
]

throw 'Could not find repo, is it really [bitbucket] one?' unless raw =~ /bitbucket/

repo_m = /^\s*url = (?:#{prefixes.join('|')})(.+?).git\s*$/mi.match(raw)
repo = repo_m[1] if repo_m

throw 'Could not find repo' unless repo

puts "REPO #{repo}"
branchs = Dir.chdir(root) { `git branch` }.lines.map { |l| l.gsub(/^\s*\*/, '') }.map(&:strip)
puts "BRANCHES #{branchs}"

throw 'Source not found' unless branchs.include?(src)

dsts = (dsts & branchs).compact
throw 'Destinations not found' if dsts.empty?

repos = []
dsts.each do |dst|
  repos << { 'repo' => repo, 'src' => src, 'dst' => dst }
end

puts "REPOS #{repos}"

Merger.new.custom_config!('repos' => repos).all!
