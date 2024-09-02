
> [!WARNING]  
> This project is still heavily WIP. Try at your own risk.

> [!TIP]  
> Available on docker hub at https://hub.docker.com/r/liranhg/epgfilter

# epgfilter
Apply filters to an EPG file and serve a slim-down version. 

This program filters channel ID's based on provided filter and expects an EPG file with channels in this format:
```
<channel id="US: Example Channel">
    <display-name>US: Example Channel</display-name>
</channel>
```
and the following programme format:
```
<programme channel="US: Example Channel" start="20240831012500 +0000" stop="20240831021500 +0000">
    <title lang="en">Show title</title>
    <desc lang="en">Show description</desc>
</programme>
```

> [!NOTE]
> Feel free to open a PR with new formatting support.  
> Alternatively, you could open an Issue for someone to pick up. Make sure to include an example EPG file in your issue.



## Quickstart

> [!CAUTION]
> You must configure the required environment variables.

1. Configure required Environment variables: 
    - **FILTER_STARTS_WITH** - Your filter condition.
    - **SOURCE_EPG_URL_PATH** - The original EPG url, from your provider.
    - **SOURCE_GENERATOR_INFO_NAME** - The default ```generator-info-name``` attribute in your original EPG url TV node. Use this to mimic the original provider response.
1. EPG filter will run automatically on start and every 6 hours (configurable in ENV).
2. Call http://yourdomain:3000/epg.xml (configurable in ENV) to get filtered EPG.

## Environment Variables
| VARIABLE    | DEFAULT | DESCRIPTION |
| -------- | ------- | ------- |
| PORT  | 3000    | Default port for the server |
| FETCH_HOUR_INTERVAL  | 6    | Hours. How often the program will call the provider to get a new EPG. |
| FETCH_ON_START  | TRUE    | Filter EPG from source when the program starts. |
| FILTER_STARTS_WITH  | EMPTY    | Only catch channels with the provided prefix. for example, if the provider lists channels by countries with a prefix ```US: CNN```, you can use the prefix 'US:' |
| SOURCE_EPG_URL_PATH  | EMPTY    | The URL for your provider's original EPG file which will be filtered |
| EPG_OUTPUT_API_RESULT_PATH  | /epg.xml    | Your filtered EPG URL path. Default will result in your EPG at: https://myserver.com/epg.xml |
| EPG_OUTPUT_FILE_PATH  | ./filtered_epg.xml    | Output filtered file path. |
| EPG_LANGUAGE  | en    | Language tag for titles and descriptions. |
| SOURCE_GENERATOR_INFO_NAME  | EMPTY    | The value of the "generator-info-name" attribute in the original EPG tv tag. |
| SOURCE_USE_LOCAL_FILE  | FALSE    | When true reads EPG from a local file instead of a server |
| SOURCE_EPG_LOCAL_FILE  | EMPTY   | If using SOURCE_USE_LOCAL_FILE you must also include a path to the file |
| SOURCE_EPG_FORCED_FILE_TYPE  | EMPTY    | If your provider masks the file type in it's url, you can set it here. (supports: xml | gz) |
| LOG_LEVEL  | INFO    | Change the program log level. SILLY is very spammy. (supports: ERROR | WARN | INFO | DEBUG | SILLY) |


# TODOs
- [x] Add to docker hub :tada:
- [ ] Enhance filtering with regex support
- [ ] Update readme with example regex patterns
