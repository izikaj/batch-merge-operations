require 'httparty'
require 'yaml'

class API
  attr_reader :repo

  def initialize(repo)
    @repo = repo
  end

  def opts
    {
      headers: {
        'Content-Type' => 'application/json'
      },
      basic_auth: {
        username: credentials.dig('app', 'username'),
        password: credentials.dig('app', 'password')
      }
    }
  end

  def get(scope = nil, query: {})
    link = scope if scope =~ %r{^https://}
    link ||= File.join(['https://api.bitbucket.org/2.0/repositories', repo, scope].compact)
    resp = HTTParty.get(link, query.merge(opts))

    JSON.parse(resp.response.body)
  rescue JSON::ParserError => _e
    resp&.response&.body
  end

  def post(scope = nil, query: {}, data: {})
    link = scope if scope =~ %r{^https://}
    link ||= File.join(['https://api.bitbucket.org/2.0/repositories', repo, scope].compact)
    resp = HTTParty.post(link, query.merge(opts).merge(body: JSON.dump(data)))

    JSON.parse(resp.response.body)
  rescue JSON::ParserError => _e
    resp&.response&.body
  end

  def credentials
    @credentials ||= YAML.safe_load(File.read('./credentials.yml'))
  end
end
