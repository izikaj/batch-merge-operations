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

repo_m = /^\s*url = git@bitbucket.org:(.+?).git\s*$/mi.match(raw)
repo = repo_m[1] if repo_m

puts "REPO #{repo}"
branch_r = /^\s*\[branch\s*"(.+?)"\]\s*$/mi
cur = 0
branchs = []
while m = branch_r.match(raw, cur)
  cur = m.end(1)
  branchs << m[1]
end
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
