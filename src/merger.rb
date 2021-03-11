require_relative './api'
require 'time'

# repo = api.get
# sleep 1
# branches = api.get(repo.dig('links', 'branches', 'href'))
# sleep 1
# branch_names = branches['values']&.map { |i| i['name'] }
# pull_requests = api.get('pullrequests')
# sleep 1

# transition = %w[staging master]
# pr = api.post(
#   'pullrequests',
#   data: {
#     title: "AUTO: Merge updates (#{transition.first} => #{transition.last})",
#     source: { branch: { name: transition.first } },
#     destination: { branch: { name: transition.last } }
#   }
# )

# resp = HTTParty.get('https://api.bitbucket.org/2.0/repositories/netfixllc?role=member', opts)

# resp.response.body

class Merger
  attr_reader :config

  def initialize
    @config = load_config
  end

  def all!
    repos.each do |rule|
      merge(repo_name(rule['repo']), [rule['src'], rule['dst']])
      sleep(1)
    end
  end

  private

  def repo_name(repo_link)
    repo_link.gsub('https://bitbucket.org/', '')
  end

  def repos
    @repos ||= config.fetch('repos', [])
  end

  def render_error(resp, raise_err = true)
    puts '-' * 30
    puts "ERROR OCCURED: #{resp.dig('error', 'message')}"
    puts '-' * 30
    raise(StandardError, resp.dig('error', 'message')) if raise_err
  end

  def time_ago(timestamp)
    diff = Time.now.to_i - Time.parse(timestamp).to_i
    seconds = diff % 60
    minutes = diff / 60 % 3600
    hours = diff / 3600
    "#{hours}h #{minutes}m #{seconds}s ago"
  end

  def render_pr_info(resp)
    mode = :closed if resp['closed_on']
    mode ||= :created if %w[OPEN].include?(resp['state'])

    puts "PR #{resp['state']}: #{resp['title']}"
    if mode
      puts "#{mode.to_s.upcase} BY: #{resp.dig(mode == :closed ? 'closed_by' : 'author', 'display_name')}"
      puts "#{mode.to_s.upcase} AT: #{time_ago(resp["#{mode}_on"])}"
    end
    puts "STATE: #{resp['state']}"
    resp
  end

  def create_pr(api, transition)
    resp = api.post(
      'pullrequests',
      data: {
        title: "AUTO: Merge updates (#{transition.first} => #{transition.last})",
        source: { branch: { name: transition.first } },
        destination: { branch: { name: transition.last } }
      }
    )
    render_error(resp) if %w[error].include?(resp['type'])

    render_pr_info(resp)
  end

  def merge_pr(api, created)
    resp = api.post(created.dig('links', 'merge', 'href'))
    render_error(resp) if %w[error].include?(resp['type'])

    render_pr_info(resp)
  end

  def merge(repo, transition = %w[staging master])
    puts "\n#{'_' * 50}\n\n"
    puts "MERGE #{repo} --- [#{transition.first}] => [#{transition.last}]"

    api = API.new(repo)

    resp = create_pr(api, transition)
    result = merge_pr(api, resp)

    # pr['title']
    # pr['close_source_branch']
    # pr["reviewers"]
    # pr["reviewers"]
    # pr["created_on"]
    # pr["state"] OPEN MERGED
    # pr["updated_on"]
    # pr["author"]["display_name"]
    # pr["links"]["decline"]["href"]
    # pr["links"]["approve"]["href"]
    # pr["links"]["merge"]["href"]
    # prr["closed_by"]["display_name"]
    # prr["closed_on"]
    puts "RESULT: #{repo} --- #{result['state']}"
  rescue StandardError => e
    puts "VISIT: #{resp.dig('links', 'html', 'href')}" if resp
    puts "FAILED #{repo}: #{e.message}"
  end

  def load_config(defaults = {})
    ARGV.each do |arg|
      next unless arg =~ /\.ya?ml/
      next unless File.exist?(arg)

      defaults.merge!(YAML.safe_load(File.read(arg)))
    end

    defaults
  end
end
