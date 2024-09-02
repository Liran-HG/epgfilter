
> [!WARNING]  
> This project is still heavily WIP. Try at your own risk.

# epgfilter
Apply filters to an EPG file and serve a slim down version

# Quickstart

> [!IMPORTANT]
> You must configure required environment variables.

1. Configure required Environment variables: 
    - **FILTER_STARTS_WITH** - Your filter condition.
    - **SOURCE_EPG_URL_PATH** - The original EPG url, from your provider.
    - **SOURCE_GENERATOR_INFO_NAME** - The default ```generator-info-name``` attribute in your original EPG url TV node. Use this to mimic the original provider response.
1. EPG filter will run automatically on start and every 6 hours (configurable in ENV).
2. Call http://yourdomain:3000/epg.xml (configurable in ENV) to get filtered EPG.

# Environment Variables
| VARIABLE    | DEFAULT | DESCRIPTION |
| -------- | ------- | ------- |
| PORT  | 3000    | Default port for the server |
| FETCH_HOUR_INTERVAL  | 6    | Hours. How often the program will call the provider to get new EPG. |
| FETCH_ON_START  | TRUE    | Filter EPG from source when program starts. |
| FILTER_STARTS_WITH  | EMPTY    | Only catch channels with the provided prefix. for example, if the provider lists channels by countries with a prefix US: CNN, you can use the prefix 'US:' |
| SOURCE_EPG_URL_PATH  | EMPTY    | The URL for your provider's original EPG file which will be filtered |
| EPG_OUTPUT_API_RESULT_PATH  | '/epg.xml'    | Your filtered EPG URL path. Default will result in your EPG at: https://myserver.com/epg.xml |
| EPG_OUTPUT_FILE_PATH  | './filtered_epg.xml'    | Output filtered file path. |
| EPG_LANGUAGE  | 'en'    | Language tag for titles and descriptions. |
| SOURCE_GENERATOR_INFO_NAME  | EMPTY    | The value of the "generator-info-name" attribute in the original EPG tv tag. |
| SOURCE_USE_LOCAL_FILE  | FALSE    | When true reads EPG from a local file instead of a server |
| SOURCE_EPG_LOCAL_FILE  | EMPTY   | If using SOURCE_USE_LOCAL_FILE you must also include a path to the file |
| SOURCE_EPG_FORCED_FILE_TYPE  | EMPTY    | If your provider masks the file type in it's url, you can set it here. (supports: xml | gz) |
| LOG_LEVEL  | INFO    | Change the program log level. SILLY is very spammy. (supports: ERROR | WARN | INFO | DEBUG | SILLY) |

