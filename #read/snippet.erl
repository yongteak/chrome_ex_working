Env = application:get_all_env(couchbeam).
Host = proplists:get_value(host,Env),
Port = proplists:get_value(port,Env),
Options = proplists:get_value(options,Env).
S = couchbeam:server_connection(Host, Port, "", Options).
{ok, _Version} = couchbeam:server_info(S).



Couch = boot_key_server:get(couch).
{ok, Db} = couchbeam:open_db(Couch, "category").

lists:foldl(fun(Key,Acc)->
    case couchbeam:open_doc(Db, Key) of
        {error,not_found} -> Acc ++[ [{<<"url">>,Key}] ];
        {ok,{Doc}} ->
            Code = boot_util:pget(<<"code">>,Doc),
            Votes = boot_util:pget(<<"votes">>,Doc),
            Exist = [ User ||{User}<-Votes, boot_util:pget(<<"user_id">>,User) =:= <<"xxx">>],
            Vote = case Exist of
                [E] -> E;
                _ -> []
            end,
            Acc ++ [ [{<<"url">> ,Key}, {<<"code">>,Code}, {<<"vote">>, Vote}] ]
        end
    end,[],[<<"test">>,<<"my_domain.com">>,<<"c">>,<<"your_domain.com">>]).

http://127.0.0.1:5984/wst_host_similarweb_analytic/_all_docs?limit=11&include_docs=true&startkey=accounts.google.com%00

http://127.0.0.1:5984/wst_host_similarweb_analytic/accounts.kakao.com


Env = application:get_all_env(couchbeam).
Host = proplists:get_value(host,Env),
Port = proplists:get_value(port,Env),
Options = proplists:get_value(options,Env).
S = couchbeam:server_connection(Host, Port, "", Options).
{ok, _Version} = couchbeam:server_info(S).



Couch = boot_key_server:get(couch).
{ok, Db} = couchbeam:open_db(Couch, "category").
[]
{ok, Doc} = couchbeam:open_doc(Db, "test").

{ok, Doc} = couchbeam:open_doc(Db, <<"my_domain.com">>).


{ok,{[{<<"code">>,<<"000">>},
      {<<"votes">>,
       [{[{<<"user_id">>,<<"xxx">>},
          {<<"code">>,<<"001">>},
          {<<"epoch">>,3234234}]},
        {[{<<"user_id">>,<<"yyyy">>},
          {<<"code">>,<<"012">>},
          {<<"epoch">>,44444555}]}]},
      {<<"similarweb">>,[]},
      {<<"_id">>,<<"my_domain.com">>},
      {<<"_rev">>,<<"4-5abb079232c101bc58a161a532372f3c">>}]}}


{ok,{Doc}} = couchbeam:open_doc(Db, <<"my_domain.com">>).
% 투표가 일어나면 가장많은 투표수의 코드로 치환한다.
Code = boot_util:pget(<<"code">>,Doc).
Votes = boot_util:pget(<<"votes">>,Doc).
Exist = [ User ||{User}<-Votes, boot_util:pget(<<"user_id">>,User) =:= <<"xxx">>].

case Exist of
    [] -> Code;
    [E] -> E
end


lists:foldl(fun(Key,Acc)->
    case couchbeam:open_doc(Db, Key) of
        {error,not_found} -> Acc ++ [Key];
        {ok,Doc} ->

    case
    Acc ++ [Key]
    end,[],[<<"test">>,<<"my_domain.com">>,<<"c">>]).
open_doc(Db, DocId)